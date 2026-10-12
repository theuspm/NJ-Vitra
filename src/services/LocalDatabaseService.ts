/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Customer,
  Product,
  Service,
  Quote,
  Order,
  CompanySettings,
} from '../types';

export interface DatabaseDump {
  version: string;
  exportedAt: string;
  customers: Customer[];
  products: Product[];
  services: Service[];
  quotes: Quote[];
  orders: Order[];
  companySettings: CompanySettings;
}

export interface DatabaseStats {
  engine: string;
  totalCustomers: number;
  totalProducts: number;
  totalServices: number;
  totalQuotes: number;
  totalOrders: number;
  estimatedBytes: number;
  lastSyncAt: string;
}

const DB_NAME = 'VidroGestaoLocalDB';
const DB_VERSION = 1;

class LocalDatabaseManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    this.getDb();
  }

  private isIndexedDbAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  private getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    if (!this.isIndexedDbAvailable()) {
      return Promise.reject(new Error('IndexedDB não suportado neste navegador.'));
    }

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        const stores = [
          'customers',
          'products',
          'services',
          'quotes',
          'orders',
          'companySettings',
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Falha ao abrir IndexedDB:', request.error);
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Salva coleção inteira no IndexedDB com transação atômica
   */
  async saveCollection<T extends { id?: string }>(
    storeName: string,
    items: T[]
  ): Promise<void> {
    try {
      const db = await this.getDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);

        // Limpa e reinsere para manter integridade com o estado da aplicação
        const clearReq = store.clear();
        clearReq.onsuccess = () => {
          for (const item of items) {
            // Se não tiver ID (ex: companySettings único), usa chave fixa
            const objToSave = item.id ? item : { ...item, id: 'singleton' };
            store.put(objToSave);
          }
        };

        tx.oncomplete = () => {
          resolve();
        };

        tx.onerror = () => {
          console.error(`Erro ao salvar coleção ${storeName} no IndexedDB:`, tx.error);
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn(`IndexedDB fallback para store ${storeName}:`, err);
    }
  }

  /**
   * Limpa todas as coleções do banco IndexedDB (Zerar Banco de Dados)
   */
  async clearAllData(): Promise<void> {
    try {
      const db = await this.getDb();
      const stores = [
        'customers',
        'products',
        'services',
        'quotes',
        'orders',
      ];
      return new Promise((resolve, reject) => {
        const tx = db.transaction(stores, 'readwrite');
        stores.forEach((storeName) => {
          if (db.objectStoreNames.contains(storeName)) {
            tx.objectStore(storeName).clear();
          }
        });
        tx.oncomplete = () => {
          resolve();
        };
        tx.onerror = () => {
          console.error('Erro ao limpar tabelas do IndexedDB:', tx.error);
          reject(tx.error);
        };
      });
    } catch (err) {
      console.warn('Erro ao limpar IndexedDB:', err);
    }
  }

  /**
   * Carrega todos os registros de uma coleção do IndexedDB
   */
  async loadCollection<T>(storeName: string): Promise<T[]> {
    try {
      const db = await this.getDb();
      return new Promise((resolve) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          console.error(`Erro ao ler coleção ${storeName}:`, request.error);
          resolve([]);
        };
      });
    } catch (err) {
      console.warn(`IndexedDB não disponível ao carregar ${storeName}:`, err);
      return [];
    }
  }

  /**
   * Exporta todo o banco local em formato JSON legível para backup
   */
  async exportFullBackup(
    customers: Customer[],
    products: Product[],
    services: Service[],
    quotes: Quote[],
    orders: Order[],
    companySettings: CompanySettings
  ): Promise<void> {
    const dump: DatabaseDump = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      customers,
      products,
      services,
      quotes,
      orders,
      companySettings,
    };

    const jsonString = JSON.stringify(dump, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateFormatted = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `vidrogestao-backup-${dateFormatted}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Valida e lê arquivo de backup importado pelo usuário
   */
  async parseBackupFile(file: File): Promise<DatabaseDump> {
    const text = await file.text();
    const data = JSON.parse(text);

    if (
      !data ||
      !Array.isArray(data.customers) ||
      !Array.isArray(data.products) ||
      !Array.isArray(data.quotes)
    ) {
      throw new Error(
        'Arquivo de backup inválido. A estrutura esperada de VidroGestão não foi reconhecida.'
      );
    }

    return data as DatabaseDump;
  }
}

export const LocalDatabaseService = new LocalDatabaseManager();
