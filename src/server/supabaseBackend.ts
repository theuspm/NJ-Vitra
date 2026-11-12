/**
 * Backend Supabase Service (Executado exclusivamente no servidor)
 * Suporta Autenticação por Lojista (Multi-Tenant) e Controle de Pacotes (BÁSICO / PREMIUM)
 * sem expor chaves ao navegador.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import express, { Request, Response, Router } from 'express';

let supabaseClient: SupabaseClient | null = null;

export function cleanSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  const dashboardMatch = cleaned.match(/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    cleaned = `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (rawUrl && rawKey) {
    const url = cleanSupabaseUrl(rawUrl);
    const key = rawKey.trim();

    try {
      console.log(`[Supabase Server] Conectando ao host: ${url}`);
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return supabaseClient;
    } catch (err) {
      console.error('[Supabase Server] Erro ao inicializar cliente:', err);
      return null;
    }
  }

  return null;
}

/**
 * Extrai o ID do lojista (tenantId) a partir do cabeçalho X-Tenant-Id
 */
function getRequestTenantId(req: Request): string {
  const headerTenant = req.headers['x-tenant-id'];
  if (typeof headerTenant === 'string' && headerTenant.trim().length > 0) {
    return headerTenant.trim();
  }
  return 'default';
}

export const apiRouter: Router = express.Router();
apiRouter.use(express.json({ limit: '10mb' }));

// Status da conexão com Supabase
apiRouter.get('/status', (_req: Request, res: Response) => {
  const sb = getSupabase();
  res.json({
    configured: Boolean(sb),
    provider: sb ? 'supabase' : 'local_storage',
    timestamp: new Date().toISOString(),
  });
});

// =========================================================
// AUTENTICAÇÃO DE LOJISTAS (SUPABASE AUTH MULTI-TENANT)
// =========================================================

// Cadastro público bloqueado: apenas o administrador cria usuários no painel do Supabase
apiRouter.post('/auth/register', async (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    error: 'O cadastro de novas vidraçarias é realizado exclusivamente pelo administrador.',
  });
});

// Login de Lojista por E-mail e Senha
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const sb = getSupabase();
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Informe seu e-mail e senha.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();

  if (!sb) {
    return res.json({
      success: false,
      configured: false,
      error: 'Servidor Supabase não configurado. Usando autenticação local.',
    });
  }

  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email: cleanEmail,
      password: String(password),
    });

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error:
          error?.message === 'Invalid login credentials'
            ? 'E-mail ou senha incorretos.'
            : error?.message || 'Credenciais inválidas.',
      });
    }

    const authUser = data.user;
    const meta = authUser.user_metadata || {};

    // Busca configurações e plano da loja deste lojista no Supabase
    let tenantSettings = await fetchTenantCompanySettings(sb, authUser.id);
    const metaPlan = meta.plan === 'PREMIUM' ? 'PREMIUM' : 'BASICO';

    // Se for o primeiro login do lojista criado no Supabase, cria automaticamente a linha dele em company_settings
    if (!tenantSettings) {
      const initialSettings = {
        id: authUser.id,
        tenantId: authUser.id,
        plan: metaPlan,
        name: meta.storeName || meta.name || 'Minha Vidraçaria',
        tradingName: meta.storeName || meta.name || 'Minha Vidraçaria',
        cnpj: '',
        whatsapp: '',
        phone: '',
        email: authUser.email || cleanEmail,
        address: '',
        city: 'São Paulo',
        state: 'SP',
      };
      await saveTenantCompanySettings(sb, authUser.id, initialSettings);
      tenantSettings = initialSettings;
    }

    const effectivePlan = tenantSettings?.plan === 'PREMIUM' ? 'PREMIUM' : metaPlan;
    const effectiveStoreName =
      tenantSettings?.tradingName ||
      tenantSettings?.name ||
      meta.storeName ||
      'Minha Vidraçaria';

    return res.json({
      success: true,
      configured: true,
      accessToken: data.session?.access_token || '',
      user: {
        id: authUser.id,
        tenantId: authUser.id,
        name: meta.name || cleanEmail.split('@')[0],
        email: authUser.email || cleanEmail,
        role: 'ADMINISTRADOR',
        plan: effectivePlan,
        storeName: effectiveStoreName,
        maxDiscountPercent: 100,
        isActive: true,
        createdAt: authUser.created_at || new Date().toISOString(),
      },
      companySettings: tenantSettings,
    });
  } catch (err: any) {
    console.error('[Supabase Auth] Erro em /auth/login:', err);
    return res.status(500).json({ error: err.message || 'Erro interno no login.' });
  }
});

// =========================================================
// FUNÇÕES AUXILIARES DE CONFIGURAÇÃO E PLANO POR LOJISTA
// =========================================================

async function fetchTenantCompanySettings(sb: SupabaseClient, tenantId: string): Promise<any | null> {
  try {
    const { data, error } = await sb
      .from('company_settings')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (error || !data) return null;

    // Extrai metadados extras guardados em address (se for objeto JSONB) ou coluna data
    const extraData =
      typeof data.data === 'object' && data.data !== null
        ? data.data
        : typeof data.address === 'object' && data.address !== null && !Array.isArray(data.address)
        ? data.address
        : {};

    return {
      ...extraData,
      id: tenantId,
      tenantId,
      plan: data.plan || extraData.plan || 'BASICO',
      name: data.name || extraData.name || 'VIDRAÇARIA & ESQUADRIAS',
      tradingName: data.trading_name || extraData.tradingName || data.name || '',
      cnpj: data.cnpj || extraData.cnpj || '',
      stateRegistration: data.state_registration || extraData.stateRegistration || '',
      phone: data.phone || extraData.phone || '',
      whatsapp: data.whatsapp || extraData.whatsapp || '',
      email: data.email || extraData.email || '',
      website: data.website || extraData.website || '',
      address:
        typeof data.address === 'string'
          ? data.address
          : typeof extraData.streetAddress === 'string'
          ? extraData.streetAddress
          : typeof extraData.address === 'string'
          ? extraData.address
          : '',
      city: extraData.city || 'São Paulo',
      state: extraData.state || 'SP',
      zipCode: extraData.zipCode || '',
      pixKey: data.pix_key || extraData.pixKey || '',
      pixKeyType: data.pix_key_type || extraData.pixKeyType || '',
    };
  } catch (err) {
    console.error('[Supabase Server] Erro em fetchTenantCompanySettings:', err);
    return null;
  }
}

async function saveTenantCompanySettings(sb: SupabaseClient, tenantId: string, settings: any) {
  // Preserva o plano que está no banco de dados (controlado exclusivamente pelo administrador no Supabase)
  const currentInDb = await fetchTenantCompanySettings(sb, tenantId);
  const effectivePlan =
    currentInDb?.plan === 'PREMIUM' || currentInDb?.plan === 'BASICO'
      ? currentInDb.plan
      : settings.plan === 'PREMIUM'
      ? 'PREMIUM'
      : 'BASICO';

  // Guardamos um objeto JSONB rico na coluna address (que já é JSONB na tabela original)
  // para preservar city, state, zipCode, plan e coleções extras sem depender de novas colunas!
  const addressJsonPayload = {
    streetAddress: typeof settings.address === 'string' ? settings.address : '',
    address: typeof settings.address === 'string' ? settings.address : '',
    city: settings.city || 'São Paulo',
    state: settings.state || 'SP',
    zipCode: settings.zipCode || '',
    plan: effectivePlan,
    tradingName: settings.tradingName || '',
    stateRegistration: settings.stateRegistration || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    pixKey: settings.pixKey || '',
    pixKeyType: settings.pixKeyType || '',
    erpCollections: settings.erpCollections || undefined,
  };

  // 1. Tenta salvar com coluna explícita 'plan' caso o usuário tenha rodado o SQL atualizado
  const rowWithPlan: any = {
    id: tenantId,
    name: settings.name || 'Sua Vidraçaria',
    trading_name: settings.tradingName || '',
    cnpj: settings.cnpj || '',
    state_registration: settings.stateRegistration || '',
    phone: settings.phone || '',
    whatsapp: settings.whatsapp || '',
    email: settings.email || '',
    website: settings.website || '',
    address: addressJsonPayload,
    pix_key: settings.pixKey || '',
    pix_key_type: settings.pixKeyType || '',
    plan: effectivePlan,
    updated_at: new Date().toISOString(),
  };

  let { error } = await sb.from('company_settings').upsert(rowWithPlan, { onConflict: 'id' });

  // 2. Se a coluna 'plan' ainda não existir na tabela, salva sem a coluna explícita 'plan' (pois já está em addressJsonPayload!)
  if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
    const { plan: _omitPlan, ...rowWithoutPlanCol } = rowWithPlan;
    const retry1 = await sb
      .from('company_settings')
      .upsert(rowWithoutPlanCol, { onConflict: 'id' });
    error = retry1.error;

    // 3. Fallback caso a tabela use coluna 'data' JSONB
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const dataRow = {
        id: tenantId,
        name: settings.name || '',
        cnpj: settings.cnpj || '',
        whatsapp: settings.whatsapp || '',
        data: { ...settings, plan: effectivePlan, tenantId },
        updated_at: new Date().toISOString(),
      };
      const retry2 = await sb.from('company_settings').upsert(dataRow, { onConflict: 'id' });
      error = retry2.error;
    }
  }

  return { error };
}

// =========================================================
// ROTAS MULTI-TENANT DE ORÇAMENTOS E EMPRESA
// =========================================================

// Listar orçamentos exclusivos do Lojista logado
apiRouter.get('/quotes', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ quotes: [], configured: false });
  }

  const tenantId = getRequestTenantId(req);

  try {
    const { data, error } = await sb
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Server] Erro ao buscar quotes:', error);
      return res.status(500).json({ error: error.message });
    }

    // Filtra apenas os orçamentos pertencentes ao lojista (tenantId)
    const tenantRows = (data || []).filter((row: any) => {
      const rowOwner =
        row.owner_id ||
        row.data?.tenantId ||
        (Array.isArray(row.items) && row.items[0]?.tenantId) ||
        (!Array.isArray(row.items) && row.items?.tenantId);

      if (tenantId === 'default') {
        return !rowOwner || rowOwner === 'default';
      }
      return rowOwner === tenantId;
    });

    const quotes = tenantRows.map((row: any) => {
      const payload = row.data || {};
      const rawItems = row.items || payload.items || [];
      const itemsList = Array.isArray(rawItems)
        ? rawItems
        : Array.isArray(rawItems?.list)
        ? rawItems.list
        : [];
      const metaSnapshot = !Array.isArray(rawItems) && rawItems?.meta ? rawItems.meta : payload;

      const subtotal = Number(row.subtotal || metaSnapshot.subtotalAmount || payload.subtotal || 0);
      const total = Number(row.total || metaSnapshot.totalAmount || payload.total || 0);
      const discountPercent = Number(row.discount_percent || metaSnapshot.discountPercent || 0);
      const discountAmount = Number(row.discount_amount || metaSnapshot.discountAmount || 0);
      const freightAmount = Number(row.freight_amount || metaSnapshot.freightAmount || 0);

      return {
        ...metaSnapshot,
        id: row.id,
        tenantId: row.owner_id || metaSnapshot.tenantId || tenantId,
        quoteNumber: row.quote_number || metaSnapshot.quoteNumber || row.id,
        customerId: metaSnapshot.customerId || 'cust-balcao',
        customerName: row.customer_name || metaSnapshot.customerName || 'Cliente Balcão',
        customerPhone: row.customer_phone || metaSnapshot.customerPhone || '',
        customerDocument: row.customer_document || metaSnapshot.customerDocument || '',
        installationAddress: row.installation_address || metaSnapshot.installationAddress || '',
        sellerName: row.seller_name || metaSnapshot.sellerName || '',
        status: row.status || metaSnapshot.status || 'EM_NEGOCIACAO',
        subtotalAmount: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        surchargeAmount: Number(metaSnapshot.surchargeAmount || 0),
        freightAmount: freightAmount,
        totalAmount: total,
        total: total,
        validityDays: row.validity_days || metaSnapshot.validityDays || 15,
        expectedDeliveryDays: row.expected_delivery_days || metaSnapshot.expectedDeliveryDays || 10,
        versions: metaSnapshot.versions || [
          {
            id: `ver-${row.id}-1`,
            quoteId: row.id,
            versionNumber: 1,
            subtotalAmount: subtotal,
            discountAmount: discountAmount,
            surchargeAmount: 0,
            freightAmount: freightAmount,
            totalAmount: total,
            items: itemsList,
            createdAt: row.created_at || new Date().toISOString(),
          },
        ],
        createdAt: row.created_at || metaSnapshot.createdAt || new Date().toISOString(),
        updatedAt: row.updated_at || metaSnapshot.updatedAt || new Date().toISOString(),
      };
    });

    return res.json({ quotes, configured: true });
  } catch (err: any) {
    console.error('[Supabase Server] Exceção em /quotes:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Salvar ou atualizar orçamento isolado por Lojista
apiRouter.post('/quotes', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ success: true, savedLocally: true, configured: false });
  }

  const tenantId = getRequestTenantId(req);

  try {
    const quote = req.body;
    if (!quote || !quote.id) {
      return res.status(400).json({ error: 'Orçamento inválido (sem ID).' });
    }

    const effectiveTenantId = quote.tenantId || tenantId;
    const totalAmount = Number(quote.totalAmount || quote.total || 0);
    const subtotalAmount = Number(quote.subtotalAmount || quote.subtotal || 0);
    const discountPercent = Number(quote.discountPercent || 0);
    const discountAmount = Number(quote.discountAmount || 0);
    const freightAmount = Number(quote.freightAmount || 0);
    const rawItems = quote.items || (quote.versions && quote.versions[0]?.items) || [];

    // Empacota tenantId junto aos itens JSONB para garantir isolamento mesmo sem coluna owner_id
    const itemsWithTenantMeta = Array.isArray(rawItems)
      ? rawItems.map((it: any) => ({ ...it, tenantId: effectiveTenantId }))
      : rawItems;

    const baseExplicitRow: any = {
      id: quote.id,
      quote_number: quote.quoteNumber || quote.id,
      customer_name: quote.customerName || 'Cliente Balcão',
      customer_phone: quote.customerPhone || '',
      customer_document: quote.customerDocument || '',
      installation_address: quote.installationAddress || '',
      seller_name: quote.sellerName || '',
      status: quote.status || 'EM_NEGOCIACAO',
      subtotal: subtotalAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      freight_amount: freightAmount,
      total: totalAmount,
      validity_days: quote.validityDays || 15,
      expected_delivery_days: quote.expectedDeliveryDays || 10,
      items:
        itemsWithTenantMeta.length > 0
          ? itemsWithTenantMeta
          : [{ tenantId: effectiveTenantId }],
      updated_at: new Date().toISOString(),
    };

    // 1. Tenta salvar com coluna owner_id explícita
    let { error } = await sb
      .from('quotes')
      .upsert({ ...baseExplicitRow, owner_id: effectiveTenantId }, { onConflict: 'id' });

    // 2. Se a coluna owner_id ainda não existir na tabela, salva no baseExplicitRow (que já guarda tenantId no JSONB items)
    if (error && (error.code === 'PGRST204' || error.message?.includes('owner_id'))) {
      const retryExplicit = await sb
        .from('quotes')
        .upsert(baseExplicitRow, { onConflict: 'id' });
      error = retryExplicit.error;
    }

    // 3. Fallback caso a tabela use coluna data JSONB
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const fallbackRow: any = {
        id: quote.id,
        quote_number: quote.quoteNumber || quote.id,
        customer_name: quote.customerName || '',
        customer_phone: quote.customerPhone || '',
        customer_document: quote.customerDocument || '',
        seller_name: quote.sellerName || '',
        status: quote.status || 'EM_NEGOCIACAO',
        total: totalAmount,
        data: { ...quote, tenantId: effectiveTenantId },
        updated_at: new Date().toISOString(),
      };

      const retryResult = await sb.from('quotes').upsert(fallbackRow, { onConflict: 'id' });
      error = retryResult.error;
    }

    if (error) {
      console.error('[Supabase Server] Erro ao salvar quote:', error);
      return res.status(500).json({ error: error.message, code: error.code });
    }

    return res.json({ success: true, id: quote.id });
  } catch (err: any) {
    console.error('[Supabase Server] Exceção ao salvar quote:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Deletar orçamento
apiRouter.delete('/quotes/:id', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ success: true, configured: false });
  }

  try {
    const { id } = req.params;
    const { error } = await sb.from('quotes').delete().eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, id });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Obter configurações e plano da empresa do Lojista logado
apiRouter.get('/company', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ companySettings: null, configured: false });
  }

  const tenantId = getRequestTenantId(req);

  try {
    const companySettings = await fetchTenantCompanySettings(sb, tenantId);
    return res.json({ companySettings, configured: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Salvar configurações e plano da empresa do Lojista logado
apiRouter.post('/company', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ success: true, configured: false });
  }

  const tenantId = getRequestTenantId(req);

  try {
    const settings = req.body || {};
    const { error } = await saveTenantCompanySettings(sb, tenantId, settings);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
