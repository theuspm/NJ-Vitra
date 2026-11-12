/**
 * Cliente HTTP para a API segura do Backend (/api/*).
 * Envia automaticamente o identificador do Lojista (X-Tenant-Id) e Token de Sessão.
 * Nunca requer chaves de banco no navegador.
 */

import { Quote, CompanySettings, User, SubscriptionPlan } from '../types';

export interface AuthApiResponse {
  success: boolean;
  configured?: boolean;
  accessToken?: string;
  user?: User;
  companySettings?: CompanySettings;
  error?: string;
}

export class BackendApiService {
  /**
   * Obtém o ID do lojista logado no navegador para isolamento Multi-Tenant
   */
  static getCurrentTenantId(): string {
    try {
      const savedUser = localStorage.getItem('vidrogestao_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.tenantId) return parsed.tenantId;
        if (parsed?.id) return parsed.id;
      }
    } catch {
      // ignore
    }
    return 'default';
  }

  private static getHeaders(): Record<string, string> {
    const token = localStorage.getItem('vidrogestao_access_token') || '';
    const tenantId = this.getCurrentTenantId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Verifica o status da conexão do backend com o banco
   */
  static async checkStatus(): Promise<{ configured: boolean; provider: string } | null> {
    try {
      const res = await fetch('/api/status', { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Login do Lojista por E-mail e Senha via Backend Supabase Auth
   */
  static async loginTenant(email: string, password: string): Promise<AuthApiResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data?.error || 'Falha ao autenticar no servidor.',
        };
      }
      return data;
    } catch {
      return {
        success: false,
        configured: false,
        error: 'Sem conexão com servidor de autenticação.',
      };
    }
  }

  /**
   * Registro de novo Lojista (Vidraçaria) via Backend Supabase Auth
   */
  static async registerTenant(payload: {
    email: string;
    password: string;
    name: string;
    storeName: string;
    cnpj?: string;
    whatsapp?: string;
    plan: SubscriptionPlan;
  }): Promise<AuthApiResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: data?.error || 'Não foi possível criar a conta.',
        };
      }
      return data;
    } catch {
      return {
        success: false,
        configured: false,
        error: 'Erro de comunicação ao registrar conta.',
      };
    }
  }

  /**
   * Busca os orçamentos exclusivos do lojista logado no banco remoto
   */
  static async fetchQuotes(tenantIdOverride?: string): Promise<Quote[] | null> {
    try {
      const headers = this.getHeaders();
      if (tenantIdOverride) {
        headers['X-Tenant-Id'] = tenantIdOverride;
      }
      const res = await fetch('/api/quotes', { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && Array.isArray(data.quotes) && data.configured) {
        return data.quotes;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Salva ou atualiza um orçamento exclusivo do lojista no banco remoto
   */
  static async saveQuote(quote: Quote): Promise<boolean> {
    try {
      const tenantId = this.getCurrentTenantId();
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ...quote, tenantId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Remove um orçamento no banco remoto
   */
  static async deleteQuote(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Busca as configurações da empresa e plano do lojista no banco remoto
   */
  static async fetchCompanySettings(tenantIdOverride?: string): Promise<CompanySettings | null> {
    try {
      const headers = this.getHeaders();
      if (tenantIdOverride) {
        headers['X-Tenant-Id'] = tenantIdOverride;
      }
      const res = await fetch('/api/company', { headers });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.companySettings && data.configured) {
        return data.companySettings;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Salva as configurações da empresa e plano do lojista no banco remoto
   */
  static async saveCompanySettings(settings: CompanySettings): Promise<boolean> {
    try {
      const tenantId = this.getCurrentTenantId();
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ ...settings, id: tenantId, tenantId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
