/**
 * Backend Supabase Service (Executado exclusivamente no servidor)
 * Não expõe chaves ao navegador.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import express, { Request, Response, Router } from 'express';

let supabaseClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key) {
    try {
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

    // Reconstitui os dados completos a partir da coluna data ou colunas diretas
    const quotes = (data || []).map((row: any) => {
      const payload = row.data || {};
      return {
        ...payload,
        id: row.id || payload.id,
        quoteNumber: row.quote_number || payload.quoteNumber,
        customerName: row.customer_name || payload.customerName,
        customerPhone: row.customer_phone || payload.customerPhone,
        customerDocument: row.customer_document || payload.customerDocument,
        sellerName: row.seller_name || payload.sellerName,
        status: row.status || payload.status,
        total: Number(row.total || payload.total || 0),
        createdAt: row.created_at || payload.createdAt,
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

    const row = {
      id: quote.id,
      quote_number: quote.quoteNumber || quote.id,
      customer_name: quote.customerName || '',
      customer_phone: quote.customerPhone || '',
      customer_document: quote.customerDocument || '',
      seller_name: quote.sellerName || '',
      status: quote.status || 'PENDENTE',
      total: Number(quote.total || 0),
      data: quote,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from('quotes')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase Server] Erro ao salvar quote:', error);
      return res.status(500).json({ error: error.message });
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
      name: data.name || payload.name,
      cnpj: data.cnpj || payload.cnpj,
      whatsapp: data.whatsapp || payload.whatsapp,
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
    const row = {
      id: 'default',
      name: settings.name || '',
      cnpj: settings.cnpj || '',
      whatsapp: settings.whatsapp || '',
      data: settings,
      updated_at: new Date().toISOString(),
    };

    const { error } = await sb
      .from('company_settings')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
