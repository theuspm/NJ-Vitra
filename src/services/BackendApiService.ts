/**
 * Cliente HTTP para a API segura do Backend (/api/*).
 * Nunca requer chaves de banco no navegador.
 */

import { Quote, CompanySettings } from '../types';

export class BackendApiService {
  /**
   * Verifica o status da conexão do backend com o banco
   */
  static async checkStatus(): Promise<{ configured: boolean; provider: string } | null> {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Busca os orçamentos salvos no banco remoto
   */
  static async fetchQuotes(): Promise<Quote[] | null> {
    try {
      const res = await fetch('/api/quotes');
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
   * Salva ou atualiza um orçamento no banco remoto
   */
  static async saveQuote(quote: Quote): Promise<boolean> {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
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
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Busca as configurações da empresa do banco remoto
   */
  static async fetchCompanySettings(): Promise<CompanySettings | null> {
    try {
      const res = await fetch('/api/company');
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
   * Salva as configurações da empresa no banco remoto
   */
  static async saveCompanySettings(settings: CompanySettings): Promise<boolean> {
    try {
      const res = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
