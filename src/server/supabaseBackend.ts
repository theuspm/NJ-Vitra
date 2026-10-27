/**
 * Backend Supabase Service (Executado exclusivamente no servidor)
 * Não expõe chaves ao navegador.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import express, { Request, Response, Router } from 'express';

let supabaseClient: SupabaseClient | null = null;

export function cleanSupabaseUrl(rawUrl: string): string {
  let cleaned = (rawUrl || '').trim();
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');
  // Remove /rest/v1 se tiver sido colado por engano
  cleaned = cleaned.replace(/\/rest\/v1\/?$/, '');
  // Se tiver sido colada a URL do painel (ex: https://supabase.com/dashboard/project/abcde...)
  const dashboardMatch = cleaned.match(/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    cleaned = `https://${dashboardMatch[1]}.supabase.co`;
  }
  // Garante o protocolo https://
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
        auth: { persistSession: false },
      });
      return supabaseClient;
    } catch (err) {
      console.error('[Supabase Server] Erro ao inicializar cliente:', err);
      return null;
    }
  }

  return null;
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

// Listar orçamentos
apiRouter.get('/quotes', async (_req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ quotes: [], configured: false });
  }

  try {
    const { data, error } = await sb
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase Server] Erro ao buscar quotes:', error);
      return res.status(500).json({ error: error.message });
    }

    const quotes = (data || []).map((row: any) => {
      const payload = row.data || {};
      const items = row.items || payload.items || [];
      const subtotal = Number(row.subtotal || payload.subtotalAmount || payload.subtotal || 0);
      const total = Number(row.total || payload.totalAmount || payload.total || 0);
      const discountPercent = Number(row.discount_percent || payload.discountPercent || 0);
      const discountAmount = Number(row.discount_amount || payload.discountAmount || 0);
      const freightAmount = Number(row.freight_amount || payload.freightAmount || 0);

      return {
        ...payload,
        id: row.id,
        quoteNumber: row.quote_number || payload.quoteNumber || row.id,
        customerName: row.customer_name || payload.customerName || 'Cliente Balcão',
        customerPhone: row.customer_phone || payload.customerPhone || '',
        customerDocument: row.customer_document || payload.customerDocument || '',
        installationAddress: row.installation_address || payload.installationAddress || '',
        sellerName: row.seller_name || payload.sellerName || '',
        status: row.status || payload.status || 'PENDENTE',
        subtotalAmount: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        freightAmount: freightAmount,
        totalAmount: total,
        total: total,
        validityDays: row.validity_days || payload.validityDays || 15,
        expectedDeliveryDays: row.expected_delivery_days || payload.expectedDeliveryDays || 10,
        versions: payload.versions || [
          {
            id: `ver-${row.id}-1`,
            quoteId: row.id,
            versionNumber: 1,
            subtotalAmount: subtotal,
            discountAmount: discountAmount,
            totalAmount: total,
            items: items,
            createdAt: row.created_at || new Date().toISOString(),
          },
        ],
        createdAt: row.created_at || payload.createdAt || new Date().toISOString(),
        updatedAt: row.updated_at || payload.updatedAt || new Date().toISOString(),
      };
    });

    return res.json({ quotes, configured: true });
  } catch (err: any) {
    console.error('[Supabase Server] Exceção em /quotes:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Salvar ou atualizar orçamento
apiRouter.post('/quotes', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ success: true, savedLocally: true, configured: false });
  }

  try {
    const quote = req.body;
    if (!quote || !quote.id) {
      return res.status(400).json({ error: 'Orçamento inválido (sem ID).' });
    }

    const totalAmount = Number(quote.totalAmount || quote.total || 0);
    const subtotalAmount = Number(quote.subtotalAmount || quote.subtotal || 0);
    const discountPercent = Number(quote.discountPercent || 0);
    const discountAmount = Number(quote.discountAmount || 0);
    const freightAmount = Number(quote.freightAmount || 0);
    const items = quote.items || (quote.versions && quote.versions[0]?.items) || [];

    // 1. Tenta salvar no formato com colunas explícitas (criadas no primeiro script SQL)
    const explicitRow: any = {
      id: quote.id,
      quote_number: quote.quoteNumber || quote.id,
      customer_name: quote.customerName || 'Cliente Balcão',
      customer_phone: quote.customerPhone || '',
      customer_document: quote.customerDocument || '',
      installation_address: quote.installationAddress || '',
      seller_name: quote.sellerName || '',
      status: quote.status || 'PENDENTE',
      subtotal: subtotalAmount,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      freight_amount: freightAmount,
      total: totalAmount,
      validity_days: quote.validityDays || 15,
      expected_delivery_days: quote.expectedDeliveryDays || 10,
      items: items,
      updated_at: new Date().toISOString(),
    };

    let { error } = await sb
      .from('quotes')
      .upsert(explicitRow, { onConflict: 'id' });

    // 2. Se a tabela foi criada com a coluna 'data' e não encontrou alguma das colunas explícitas
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      console.log('[Supabase Server] Tentando formato com coluna data JSONB...');
      const fallbackRow: any = {
        id: quote.id,
        quote_number: quote.quoteNumber || quote.id,
        customer_name: quote.customerName || '',
        customer_phone: quote.customerPhone || '',
        customer_document: quote.customerDocument || '',
        seller_name: quote.sellerName || '',
        status: quote.status || 'PENDENTE',
        total: totalAmount,
        data: quote,
        updated_at: new Date().toISOString(),
      };

      const retryResult = await sb
        .from('quotes')
        .upsert(fallbackRow, { onConflict: 'id' });
      
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

// Obter configurações da empresa
apiRouter.get('/company', async (_req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ companySettings: null, configured: false });
  }

  try {
    const { data, error } = await sb
      .from('company_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error('[Supabase Server] Erro ao buscar company_settings:', error);
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ companySettings: null, configured: true });
    }

    const payload = data.data || {};
    const companySettings = {
      ...payload,
      id: 'default',
      name: data.name || payload.name || 'VIDRAÇARIA & ESQUADRIAS',
      tradingName: data.trading_name || payload.tradingName || '',
      cnpj: data.cnpj || payload.cnpj || '',
      stateRegistration: data.state_registration || payload.stateRegistration || '',
      phone: data.phone || payload.phone || '',
      whatsapp: data.whatsapp || payload.whatsapp || '',
      email: data.email || payload.email || '',
      website: data.website || payload.website || '',
      address: typeof data.address === 'string' ? data.address : payload.address || '',
      pixKey: data.pix_key || payload.pixKey || '',
      pixKeyType: data.pix_key_type || payload.pixKeyType || '',
    };

    return res.json({ companySettings, configured: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Salvar configurações da empresa
apiRouter.post('/company', async (req: Request, res: Response) => {
  const sb = getSupabase();
  if (!sb) {
    return res.json({ success: true, configured: false });
  }

  try {
    const settings = req.body;
    
    // Tenta formato com colunas explícitas
    const explicitRow = {
      id: 'default',
      name: settings.name || '',
      trading_name: settings.tradingName || '',
      cnpj: settings.cnpj || '',
      state_registration: settings.stateRegistration || '',
      phone: settings.phone || '',
      whatsapp: settings.whatsapp || '',
      email: settings.email || '',
      website: settings.website || '',
      address: settings.address || '',
      pix_key: settings.pixKey || '',
      pix_key_type: settings.pixKeyType || '',
      updated_at: new Date().toISOString(),
    };

    let { error } = await sb
      .from('company_settings')
      .upsert(explicitRow, { onConflict: 'id' });

    // Se a tabela tiver data JSONB
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const dataRow = {
        id: 'default',
        name: settings.name || '',
        cnpj: settings.cnpj || '',
        whatsapp: settings.whatsapp || '',
        data: settings,
        updated_at: new Date().toISOString(),
      };
      const retryResult = await sb
        .from('company_settings')
        .upsert(dataRow, { onConflict: 'id' });
      error = retryResult.error;
    }

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
