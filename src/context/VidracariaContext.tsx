import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Product,
  ProductCategory,
  Service,
  Supplier,
  PaymentMethod,
  Quote,
  QuoteItem,
  QuoteVersion,
  Order,
  OrderItem,
  Stock,
  StockMovement,
  ProductionOrder,
  Receivable,
  MaterialLoss,
  AuditLog,
  Notification,
  User,
  PriceHistory,
  InventoryCount,
  Payment,
  CompanySettings,
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_SUPPLIERS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_QUOTES,
  INITIAL_ORDERS,
  INITIAL_STOCKS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_RECEIVABLES,
  INITIAL_LOSSES,
  INITIAL_AUDIT_LOGS,
} from '../services/SeedData';
import { useAuth } from './AuthContext';
import { DiscountPolicyService } from '../services/DiscountPolicyService';
import { GlassCalculationService } from '../services/GlassCalculationService';
import { LocalDatabaseService } from '../services/LocalDatabaseService';
import { BackendApiService } from '../services/BackendApiService';

interface VidracariaContextType {
  // Dados
  customers: Customer[];
  products: Product[];
  categories: ProductCategory[];
  services: Service[];
  suppliers: Supplier[];
  paymentMethods: PaymentMethod[];
  quotes: Quote[];
  orders: Order[];
  stocks: Stock[];
  stockMovements: StockMovement[];
  productionOrders: ProductionOrder[];
  receivables: Receivable[];
  materialLosses: MaterialLoss[];
  auditLogs: AuditLog[];
  notifications: Notification[];
  priceHistories: PriceHistory[];
  companySettings: CompanySettings;
  updateCompanySettings: (settings: Partial<CompanySettings>) => void;

  // Ações de Clientes
  saveCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Customer;
  deleteCustomer: (id: string) => void;

  // Ações de Produtos & Preços
  saveProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => Product;
  updateProductPrice: (productId: string, newSalePrice: number, newCostPrice?: number, reason?: string) => void;
  deleteProduct: (id: string) => void;

  // Ações de Serviços
  saveService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => void;
  deleteService: (id: string) => void;

  // Ações de Fornecedores
  saveSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>, existingId?: string) => void;
  deleteSupplier: (id: string) => void;

  // Ações de Orçamentos
  createQuote: (data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocument?: string;
    sellerName?: string;
    expectedDeliveryDays?: number;
    installationAddress?: string;
    paymentConditionId?: string;
    discountPercent?: number;
    freightAmount?: number;
    notes?: string;
    items: Array<{
      itemType: 'PRODUTO' | 'SERVICO';
      productId?: string;
      serviceId?: string;
      code: string;
      description: string;
      unit: any;
      widthMm?: number;
      heightMm?: number;
      areaM2?: number;
      weightKg?: number;
      finishingDetails?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>;
  }) => Quote;
  createQuoteVersion: (quoteId: string, notes: string, updatedItems?: QuoteItem[]) => void;
  approveQuote: (quoteId: string, notes?: string) => void;
  convertQuoteToOrder: (quoteId: string) => Order;

  // Ações de Pedidos & Produção
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  advanceProductionStep: (productionOrderId: string, stepIndex: number, notes?: string) => void;
  addMeasurement: (productionOrderId: string, measurement: {
    environment: string;
    widthMm: number;
    heightMm: number;
    thicknessMm?: number;
    glassType?: string;
    notes?: string;
    photos?: string[];
  }) => void;

  // Ações de Estoque
  registerStockMovement: (productId: string, type: StockMovement['type'], quantity: number, reason: string) => void;
  executeInventoryCount: (items: Array<{ productId: string; countedQuantity: number; adjustmentReason: string }>) => void;
  registerMaterialLoss: (productId: string, quantity: number, reason: MaterialLoss['reason'], notes?: string, orderId?: string) => void;

  // Ações Financeiras
  registerPayment: (receivableId: string, paymentMethodName: string, amountPaid: number, notes?: string) => void;

  // Busca e Notificações
  searchGlobal: (query: string) => {
    customers: Customer[];
    products: Product[];
    quotes: Quote[];
    orders: Order[];
  };
  markNotificationAsRead: (id: string) => void;
  clearDatabaseToZero: () => Promise<void>;
  resetToSeedData: () => void;
  recordAuditLog: (action: string, entity: string, entityId: string, details?: string, oldValue?: any, newValue?: any) => void;
}

const VidracariaContext = createContext<VidracariaContextType | undefined>(undefined);

export const VidracariaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Helper para carregar ou inicializar do LocalStorage
  const loadInitial = <T,>(key: string, fallback: T): T => {
    const data = localStorage.getItem(`vidrogestao_${key}`);
    if (data !== null) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error(e);
      }
    }
    return fallback;
  };

  // Zeragem Inicial e Migração para Banco de Dados Limpo (Tudo do Zero)
  const ZERO_FLAG = 'vidrogestao_db_zeroed_v3';
  if (typeof window !== 'undefined' && localStorage.getItem(ZERO_FLAG) !== 'true') {
    localStorage.setItem('vidrogestao_customers', '[]');
    localStorage.setItem('vidrogestao_products', '[]');
    localStorage.setItem('vidrogestao_services', '[]');
    localStorage.setItem('vidrogestao_suppliers', '[]');
    localStorage.setItem('vidrogestao_quotes', '[]');
    localStorage.setItem('vidrogestao_orders', '[]');
    localStorage.setItem('vidrogestao_stocks', '[]');
    localStorage.setItem('vidrogestao_stock_movements', '[]');
    localStorage.setItem('vidrogestao_production_orders', '[]');
    localStorage.setItem('vidrogestao_receivables', '[]');
    localStorage.setItem('vidrogestao_losses', '[]');
    localStorage.setItem('vidrogestao_audit_logs', '[]');
    localStorage.setItem(ZERO_FLAG, 'true');
    LocalDatabaseService.clearAllData().catch(console.error);
  }

  const [customers, setCustomers] = useState<Customer[]>(() => loadInitial('customers', []));
  const [products, setProducts] = useState<Product[]>(() => loadInitial('products', []));
  const [categories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [services, setServices] = useState<Service[]>(() => loadInitial('services', []));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadInitial('suppliers', []));
  const [paymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS);
  const [quotes, setQuotes] = useState<Quote[]>(() => loadInitial('quotes', []));
  const [orders, setOrders] = useState<Order[]>(() => loadInitial('orders', []));
  const [stocks, setStocks] = useState<Stock[]>(() => loadInitial('stocks', []));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => loadInitial('stock_movements', []));
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => loadInitial('production_orders', []));
  const [receivables, setReceivables] = useState<Receivable[]>(() => loadInitial('receivables', []));
  const [materialLosses, setMaterialLosses] = useState<MaterialLoss[]>(() => loadInitial('losses', []));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => loadInitial('audit_logs', []));
  const [priceHistories, setPriceHistories] = useState<PriceHistory[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() =>
    loadInitial('company_settings', {
      name: 'VIDRAÇARIA & ESQUADRIAS',
      tradingName: 'Sua Vidraçaria',
      cnpj: '',
      stateRegistration: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      quotePolicyNotes: 'Vidros de segurança temperados e laminados certificados conforme normas ABNT NBR 14698/14697. Instalação executada por equipe especializada.',
      updatedAt: new Date().toISOString(),
    })
  );

  const updateCompanySettings = (newSettings: Partial<CompanySettings>) => {
    setCompanySettings((prev) => {
      const updated: CompanySettings = {
        ...prev,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('vidrogestao_company_settings', JSON.stringify(updated));
      BackendApiService.saveCompanySettings(updated);
      return updated;
    });
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Sincronização inicial com o Banco de Dados do Backend (Supabase)
  useEffect(() => {
    let isMounted = true;

    BackendApiService.fetchQuotes().then((remoteQuotes) => {
      if (isMounted && remoteQuotes && remoteQuotes.length > 0) {
        setQuotes((prev) => {
          const map = new Map<string, Quote>();
          prev.forEach((q) => map.set(q.id, q));
          remoteQuotes.forEach((q) => map.set(q.id, q));
          return Array.from(map.values());
        });
      }
    });

    BackendApiService.fetchCompanySettings().then((remoteSettings) => {
      if (isMounted && remoteSettings) {
        setCompanySettings((prev) => ({
          ...prev,
          ...remoteSettings,
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persistência em LocalStorage e IndexedDB (Banco Local Seguro)
  useEffect(() => {
    localStorage.setItem('vidrogestao_customers', JSON.stringify(customers));
    LocalDatabaseService.saveCollection('customers', customers);
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_products', JSON.stringify(products));
    LocalDatabaseService.saveCollection('products', products);
  }, [products]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_services', JSON.stringify(services));
    LocalDatabaseService.saveCollection('services', services);
  }, [services]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_quotes', JSON.stringify(quotes));
    LocalDatabaseService.saveCollection('quotes', quotes);
  }, [quotes]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_orders', JSON.stringify(orders));
    LocalDatabaseService.saveCollection('orders', orders);
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_stocks', JSON.stringify(stocks));
  }, [stocks]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_production_orders', JSON.stringify(productionOrders));
  }, [productionOrders]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_receivables', JSON.stringify(receivables));
  }, [receivables]);

  useEffect(() => {
    localStorage.setItem('vidrogestao_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Auditoria Central
  const logAudit = (action: string, entity: string, entityId: string, details?: string, oldValue?: any, newValue?: any) => {
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entity,
      entityId,
      details,
      oldValue,
      newValue,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // ==========================================
  // CLIENTES
  // ==========================================
  const saveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string): Customer => {
    const now = new Date().toISOString();
    let savedCustomer: Customer;

    if (existingId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id === existingId) {
            savedCustomer = { ...c, ...customerData, updatedAt: now };
            return savedCustomer;
          }
          return c;
        })
      );
      logAudit('UPDATE', 'Customer', existingId, `Cliente ${customerData.name} atualizado`);
      savedCustomer = { ...customerData, id: existingId, createdAt: now, updatedAt: now } as Customer;
    } else {
      const newId = `cust-${Date.now()}`;
      savedCustomer = {
        ...customerData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };
      setCustomers((prev) => [savedCustomer, ...prev]);
      logAudit('CREATE', 'Customer', newId, `Novo cliente cadastrado: ${customerData.name}`);
    }
    return savedCustomer;
  };

  const deleteCustomer = (id: string) => {
    const now = new Date().toISOString();
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, deletedAt: now } : c))
    );
    logAudit('DELETE_LOGICAL', 'Customer', id, 'Cliente marcado com soft-delete');
  };

  // ==========================================
  // PRODUTOS & PREÇOS
  // ==========================================
  const saveProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string): Product => {
    const now = new Date().toISOString();
    let savedProduct: Product;

    if (existingId) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === existingId) {
            savedProduct = { ...p, ...productData, updatedAt: now };
            return savedProduct;
          }
          return p;
        })
      );
      logAudit('UPDATE', 'Product', existingId, `Produto ${productData.name} atualizado`);
      savedProduct = { ...productData, id: existingId, createdAt: now, updatedAt: now } as Product;
    } else {
      const newId = `prod-${Date.now()}`;
      savedProduct = {
        ...productData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      };
      setProducts((prev) => [savedProduct, ...prev]);
      
      // Criação de estoque zerado inicial
      setStocks((prev) => [
        ...prev,
        {
          productId: newId,
          physicalStock: 0,
          reservedStock: 0,
          availableStock: 0,
          updatedAt: now,
        },
      ]);
      logAudit('CREATE', 'Product', newId, `Novo produto cadastrado: ${productData.name} (${productData.internalCode})`);
    }
    return savedProduct;
  };

  const updateProductPrice = (productId: string, newSalePrice: number, newCostPrice?: number, reason?: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const oldPrice = prod.salePrice;
    const oldCost = prod.costPrice;
    const now = new Date().toISOString();

    const historyEntry: PriceHistory = {
      id: `ph-${Date.now()}`,
      productId,
      oldPrice,
      newPrice: newSalePrice,
      oldCost,
      newCost: newCostPrice ?? oldCost,
      userId: currentUser.id,
      userName: currentUser.name,
      reason: reason || 'Reajuste de tabela comercial',
      changedAt: now,
    };

    setPriceHistories((prev) => [historyEntry, ...prev]);

    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId
          ? {
              ...p,
              salePrice: newSalePrice,
              costPrice: newCostPrice ?? p.costPrice,
              updatedAt: now,
            }
          : p
      )
    );

    logAudit(
      'PRICE_CHANGE',
      'Product',
      productId,
      `Preço alterado de R$ ${oldPrice.toFixed(2)} para R$ ${newSalePrice.toFixed(2)}. Motivo: ${reason || 'Não informado'}`,
      { salePrice: oldPrice },
      { salePrice: newSalePrice }
    );
  };

  const deleteProduct = (id: string) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, deletedAt: now, isActive: false } : p))
    );
    logAudit('DELETE_LOGICAL', 'Product', id, 'Produto desativado com soft-delete');
  };

  // ==========================================
  // SERVIÇOS & FORNECEDORES
  // ==========================================
  const saveService = (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>, existingId?: string) => {
    const now = new Date().toISOString();
    if (existingId) {
      setServices((prev) =>
        prev.map((s) => (s.id === existingId ? { ...s, ...serviceData } : s))
      );
      logAudit('UPDATE', 'Service', existingId, `Serviço ${serviceData.name} atualizado`);
    } else {
      const newService: Service = {
        ...serviceData,
        id: `serv-${Date.now()}`,
        createdAt: now,
      };
      setServices((prev) => [newService, ...prev]);
      logAudit('CREATE', 'Service', newService.id, `Novo serviço cadastrado: ${serviceData.name}`);
    }
  };

  const deleteService = (id: string) => {
    const now = new Date().toISOString();
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, deletedAt: now, isActive: false } : s)));
    logAudit('DELETE_LOGICAL', 'Service', id, 'Serviço desativado');
  };

  const saveSupplier = (supplierData: Omit<Supplier, 'id' | 'createdAt'>, existingId?: string) => {
    const now = new Date().toISOString();
    if (existingId) {
      setSuppliers((prev) =>
        prev.map((s) => (s.id === existingId ? { ...s, ...supplierData } : s))
      );
      logAudit('UPDATE', 'Supplier', existingId, `Fornecedor ${supplierData.tradeName} atualizado`);
    } else {
      const newSupplier: Supplier = {
        ...supplierData,
        id: `sup-${Date.now()}`,
        createdAt: now,
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
      logAudit('CREATE', 'Supplier', newSupplier.id, `Novo fornecedor: ${supplierData.tradeName}`);
    }
  };

  const deleteSupplier = (id: string) => {
    const now = new Date().toISOString();
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, deletedAt: now } : s)));
    logAudit('DELETE_LOGICAL', 'Supplier', id, 'Fornecedor desativado');
  };

  // ==========================================
  // ORÇAMENTOS (QUOTES)
  // ==========================================
  const createQuote = (data: {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerDocument?: string;
    sellerName?: string;
    expectedDeliveryDays?: number;
    installationAddress?: string;
    paymentConditionId?: string;
    discountPercent?: number;
    freightAmount?: number;
    notes?: string;
    items: Array<{
      itemType: 'PRODUTO' | 'SERVICO';
      productId?: string;
      serviceId?: string;
      code: string;
      description: string;
      unit: any;
      widthMm?: number;
      heightMm?: number;
      areaM2?: number;
      weightKg?: number;
      finishingDetails?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>;
  }): Quote => {
    const requestedDiscount = data.discountPercent || 0;

    // Validação de alçada de desconto do usuário
    const discountCheck = DiscountPolicyService.validateDiscount(currentUser.role, requestedDiscount);
    if (!discountCheck.isValid) {
      throw new Error(discountCheck.message);
    }

    // Identificação ou criação transparente do cliente manual
    let effectiveCustomerId = data.customerId;
    const manualName = data.customerName?.trim() || '';
    if (!effectiveCustomerId) {
      const existing = customers.find(
        (c) => c.name.trim().toLowerCase() === manualName.toLowerCase()
      );
      if (existing) {
        effectiveCustomerId = existing.id;
      } else {
        const newCustId = `cust-${Date.now()}`;
        const newCust: Customer = {
          id: newCustId,
          type: data.customerDocument && data.customerDocument.length > 14 ? 'PJ' : 'PF',
          name: manualName || 'Consumidor',
          document: data.customerDocument || '',
          phone: data.customerPhone || '',
          whatsapp: data.customerPhone || '',
          email: '',
          addresses: data.installationAddress
            ? [
                {
                  id: `addr-${Date.now()}`,
                  customerId: newCustId,
                  type: 'INSTALACAO',
                  street: data.installationAddress,
                  number: 'S/N',
                  neighborhood: '',
                  city: '',
                  state: '',
                  zipCode: '',
                  isDefault: true,
                },
              ]
            : [],
          notes: 'Cliente inserido no orçamento manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setCustomers((prev) => [newCust, ...prev]);
        effectiveCustomerId = newCustId;
      }
    }

    const quoteSeq = 1000 + quotes.length + 1;
    const quoteNumber = `ORC-2026-${quoteSeq.toString().padStart(6, '0')}`;
    const quoteId = `quote-${Date.now()}`;
    const versionId = `ver-${Date.now()}-1`;

    // Processamento de itens e snapshots
    let subtotal = 0;
    const preparedItems: QuoteItem[] = data.items.map((item, idx) => {
      const lineTotal = GlassCalculationService.roundMoney(
        item.quantity * item.unitPrice - (item.discountAmount || 0)
      );
      subtotal += lineTotal;

      return {
        id: `item-${Date.now()}-${idx}`,
        quoteVersionId: versionId,
        itemOrder: idx + 1,
        itemType: item.itemType,
        productId: item.productId,
        serviceId: item.serviceId,
        code: item.code,
        description: item.description,
        unit: item.unit,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        areaM2: item.areaM2,
        weightKg: item.weightKg,
        finishingDetails: item.finishingDetails,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount || 0,
        totalPrice: lineTotal,
      };
    });

    subtotal = GlassCalculationService.roundMoney(subtotal);

    // Desconto comercial
    const discountVal = GlassCalculationService.roundMoney((subtotal * requestedDiscount) / 100);
    const freight = GlassCalculationService.roundMoney(data.freightAmount || 0);

    // Condição de pagamento (ex: acréscimo ou desconto à vista)
    let surcharge = 0;
    if (data.paymentConditionId) {
      paymentMethods.forEach((pm) => {
        const cond = pm.conditions.find((c) => c.id === data.paymentConditionId);
        if (cond && cond.surchargePercent > 0) {
          surcharge = GlassCalculationService.roundMoney(
            ((subtotal - discountVal) * cond.surchargePercent) / 100
          );
        }
      });
    }

    const total = GlassCalculationService.roundMoney(subtotal - discountVal + surcharge + freight);

    const initialVersion: QuoteVersion = {
      id: versionId,
      quoteId,
      versionNumber: 1,
      subtotalAmount: subtotal,
      discountAmount: discountVal,
      surchargeAmount: surcharge,
      freightAmount: freight,
      totalAmount: total,
      notes: 'Versão inicial gerada',
      createdAt: new Date().toISOString(),
      items: preparedItems,
    };

    const newQuote: Quote = {
      id: quoteId,
      quoteNumber,
      customerId: effectiveCustomerId || 'cust-balcao',
      customerName: manualName || undefined,
      customerPhone: data.customerPhone?.trim() || undefined,
      customerDocument: data.customerDocument?.trim() || undefined,
      userId: currentUser.id,
      sellerName: data.sellerName?.trim() || undefined,
      currentVersion: 1,
      status: 'EM_NEGOCIACAO',
      issueDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 15 * 86400000).toISOString(),
      expectedDeliveryDays: data.expectedDeliveryDays || 10,
      installationAddress: data.installationAddress,
      paymentConditionId: data.paymentConditionId,
      subtotalAmount: subtotal,
      discountPercent: requestedDiscount,
      discountAmount: discountVal,
      surchargeAmount: surcharge,
      freightAmount: freight,
      totalAmount: total,
      notes: data.notes,
      versions: [initialVersion],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
    BackendApiService.saveQuote(newQuote);
    logAudit(
      'CREATE_QUOTE',
      'Quote',
      quoteId,
      `Orçamento ${quoteNumber} emitido no valor de R$ ${total.toFixed(2)} com ${requestedDiscount}% de desconto comercial`
    );

    return newQuote;
  };

  const createQuoteVersion = (quoteId: string, notes: string, updatedItems?: QuoteItem[]) => {
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === quoteId) {
          if (q.status === 'APROVADO') {
            throw new Error('Orçamento já aprovado não pode ser alterado livremente.');
          }
          const nextVerNum = q.currentVersion + 1;
          const prevVer = q.versions.find((v) => v.versionNumber === q.currentVersion) || q.versions[0];
          const newItems = updatedItems || prevVer.items;

          let subtotal = 0;
          newItems.forEach((it) => (subtotal += it.totalPrice));
          const discountVal = GlassCalculationService.roundMoney((subtotal * q.discountPercent) / 100);
          const total = GlassCalculationService.roundMoney(subtotal - discountVal + q.surchargeAmount + q.freightAmount);

          const newVersion: QuoteVersion = {
            id: `ver-${Date.now()}-${nextVerNum}`,
            quoteId,
            versionNumber: nextVerNum,
            subtotalAmount: subtotal,
            discountAmount: discountVal,
            surchargeAmount: q.surchargeAmount,
            freightAmount: q.freightAmount,
            totalAmount: total,
            notes: notes || `Revisão comercial ${nextVerNum}`,
            createdAt: new Date().toISOString(),
            items: newItems,
          };

          return {
            ...q,
            currentVersion: nextVerNum,
            subtotalAmount: subtotal,
            discountAmount: discountVal,
            totalAmount: total,
            versions: [...q.versions, newVersion],
            updatedAt: new Date().toISOString(),
          };
        }
        return q;
      })
    );

    logAudit('NEW_VERSION_QUOTE', 'Quote', quoteId, `Nova versão do orçamento gerada: ${notes}`);
  };

  const approveQuote = (quoteId: string, notes?: string) => {
    const now = new Date().toISOString();
    setQuotes((prev) =>
      prev.map((q) => {
        if (q.id === quoteId) {
          if (q.status === 'CANCELADO') {
            throw new Error('Não é permitido aprovar orçamento cancelado.');
          }
          const updatedQuote: Quote = {
            ...q,
            status: 'APROVADO',
            approvedAt: now,
            approvedByUserId: currentUser.id,
            approvalNotes: notes || 'Aprovado pelo cliente via contato telefônico/WhatsApp',
            updatedAt: now,
          };
          BackendApiService.saveQuote(updatedQuote);
          return updatedQuote;
        }
        return q;
      })
    );

    logAudit('APPROVE_QUOTE', 'Quote', quoteId, `Orçamento aprovado por ${currentUser.name}: ${notes || 'Sem observações'}`);
  };

  // ==========================================
  // CONVERSÃO ORÇAMENTO -> PEDIDO (ATÔMICA)
  // ==========================================
  const convertQuoteToOrder = (quoteId: string): Order => {
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote) throw new Error('Orçamento não encontrado');
    if (quote.status !== 'APROVADO') {
      throw new Error('Apenas orçamentos com status APROVADO podem ser convertidos em pedido.');
    }

    const activeVersion =
      quote.versions.find((v) => v.versionNumber === quote.currentVersion) || quote.versions[0];
    if (!activeVersion || activeVersion.items.length === 0) {
      throw new Error('Orçamento sem itens válidos para faturamento.');
    }

    // 1. Gera código exclusivo de pedido
    const orderSeq = 840 + orders.length + 1;
    const orderNumber = `PED-2026-${orderSeq.toString().padStart(6, '0')}`;
    const orderId = `ord-${Date.now()}`;
    const now = new Date().toISOString();

    // 2. Snapshot fiel de itens
    const orderItems: OrderItem[] = activeVersion.items.map((it, idx) => ({
      id: `ord-item-${Date.now()}-${idx}`,
      orderId,
      itemType: it.itemType,
      productId: it.productId,
      serviceId: it.serviceId,
      code: it.code,
      description: it.description,
      unit: it.unit,
      widthMm: it.widthMm,
      heightMm: it.heightMm,
      areaM2: it.areaM2,
      weightKg: it.weightKg,
      finishingDetails: it.finishingDetails,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      discountAmount: it.discountAmount,
      totalPrice: it.totalPrice,
    }));

    // 3. Reserva Atômica de Estoque
    activeVersion.items.forEach((item) => {
      if (item.itemType === 'PRODUTO' && item.productId) {
        setStocks((prevStocks) =>
          prevStocks.map((stk) => {
            if (stk.productId === item.productId) {
              const newReserved = GlassCalculationService.roundMoney(stk.reservedStock + item.quantity);
              const newAvail = GlassCalculationService.roundMoney(stk.physicalStock - newReserved);

              // Registra movimentação de reserva
              const movement: StockMovement = {
                id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                productId: item.productId!,
                productName: item.description,
                type: 'RESERVA',
                quantity: item.quantity,
                previousPhysical: stk.physicalStock,
                nextPhysical: stk.physicalStock,
                previousReserved: stk.reservedStock,
                nextReserved: newReserved,
                orderId,
                reason: `Reserva vinculada ao Pedido #${orderNumber}`,
                userId: currentUser.id,
                userName: currentUser.name,
                createdAt: now,
              };
              setStockMovements((prevMovs) => [movement, ...prevMovs]);

              return {
                ...stk,
                reservedStock: newReserved,
                availableStock: newAvail,
                updatedAt: now,
              };
            }
            return stk;
          })
        );
      }
    });

    // 4. Criação do Pedido
    const customer = customers.find((c) => c.id === quote.customerId);
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      quoteId: quote.id,
      approvedQuoteVer: activeVersion.versionNumber,
      customerId: quote.customerId,
      userId: quote.userId,
      status: 'AGUARDANDO_PRODUCAO',
      orderDate: now,
      promisedDeliveryDate: new Date(Date.now() + (quote.expectedDeliveryDays || 10) * 86400000).toISOString(),
      deliveryAddress: quote.deliveryAddress,
      installationAddress: quote.installationAddress,
      paymentConditionId: quote.paymentConditionId,
      subtotalAmount: activeVersion.subtotalAmount,
      discountAmount: activeVersion.discountAmount,
      surchargeAmount: activeVersion.surchargeAmount,
      freightAmount: activeVersion.freightAmount,
      totalAmount: activeVersion.totalAmount,
      notes: quote.notes,
      items: orderItems,
      createdAt: now,
      updatedAt: now,
    };

    setOrders((prev) => [newOrder, ...prev]);

    // 5. Criação da Ordem de Produção (com todas as etapas da vidraçaria)
    const newProductionOrder: ProductionOrder = {
      id: `prod-ord-${Date.now()}`,
      orderId,
      orderNumber,
      customerName: customer?.name || 'Cliente',
      currentStage: 'MEDICAO',
      startDate: now,
      notes: `Ordem gerada automaticamente para o pedido #${orderNumber}`,
      measurements: [],
      steps: [
        {
          id: `step-1-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'MEDICAO',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-2-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'PROJETO',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-3-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'CORTE',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-4-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'BENEFICIAMENTO',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-5-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'MONTAGEM',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-6-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'EXPEDICAO',
          status: 'PENDENTE',
          attachments: [],
        },
        {
          id: `step-7-${Date.now()}`,
          productionOrderId: `prod-ord-${Date.now()}`,
          stage: 'INSTALACAO',
          status: 'PENDENTE',
          attachments: [],
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    setProductionOrders((prev) => [newProductionOrder, ...prev]);

    // 6. Geração do Contas a Receber (Parcelas financeiras)
    const newReceivable: Receivable = {
      id: `rec-${Date.now()}`,
      orderId,
      orderNumber,
      customerId: quote.customerId,
      customerName: customer?.name || 'Cliente',
      installmentNum: 1,
      totalInstallments: 1,
      originalAmount: activeVersion.totalAmount,
      paidAmount: 0,
      balanceDue: activeVersion.totalAmount,
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      status: 'PENDENTE',
      payments: [],
      createdAt: now,
      updatedAt: now,
    };

    setReceivables((prev) => [newReceivable, ...prev]);

    // 7. Notificação e Auditoria
    logAudit(
      'CONVERT_TO_ORDER',
      'Order',
      orderId,
      `Orçamento ${quote.quoteNumber} convertido com sucesso no Pedido ${orderNumber}. Estoque reservado e Ordem de Produção criada.`
    );

    return newOrder;
  };

  // ==========================================
  // PEDIDOS & PRODUÇÃO
  // ==========================================
  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    const now = new Date().toISOString();
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus, updatedAt: now } : o))
    );
    logAudit('UPDATE_STATUS', 'Order', orderId, `Status do pedido alterado para ${newStatus}`);
  };

  const advanceProductionStep = (productionOrderId: string, stepIndex: number, notes?: string) => {
    const now = new Date().toISOString();
    const STAGES: Array<ProductionOrder['currentStage']> = [
      'MEDICAO',
      'PROJETO',
      'CORTE',
      'BENEFICIAMENTO',
      'MONTAGEM',
      'EXPEDICAO',
      'INSTALACAO',
      'CONCLUIDO',
    ];

    setProductionOrders((prev) =>
      prev.map((po) => {
        if (po.id === productionOrderId) {
          const updatedSteps = po.steps.map((st, idx) => {
            if (idx === stepIndex) {
              return {
                ...st,
                status: 'CONCLUIDO' as const,
                assignedUserId: currentUser.id,
                assignedUserName: currentUser.name,
                completedAt: now,
                notes: notes || st.notes,
              };
            }
            if (idx === stepIndex + 1) {
              return {
                ...st,
                status: 'EM_ANDAMENTO' as const,
                startedAt: now,
              };
            }
            return st;
          });

          const nextStage = STAGES[stepIndex + 1] || 'CONCLUIDO';
          return {
            ...po,
            currentStage: nextStage,
            steps: updatedSteps,
            updatedAt: now,
          };
        }
        return po;
      })
    );

    logAudit('ADVANCE_PRODUCTION', 'ProductionOrder', productionOrderId, `Etapa ${stepIndex + 1} concluída`);
  };

  const addMeasurement = (
    productionOrderId: string,
    data: {
      environment: string;
      widthMm: number;
      heightMm: number;
      thicknessMm?: number;
      glassType?: string;
      notes?: string;
      photos?: string[];
    }
  ) => {
    const now = new Date().toISOString();
    const newMeas = {
      id: `meas-${Date.now()}`,
      productionOrderId,
      environment: data.environment,
      widthMm: data.widthMm,
      heightMm: data.heightMm,
      thicknessMm: data.thicknessMm,
      glassType: data.glassType,
      notes: data.notes,
      photos: data.photos || [],
      measuredByUserId: currentUser.id,
      measuredByUserName: currentUser.name,
      measuredAt: now,
    };

    setProductionOrders((prev) =>
      prev.map((po) =>
        po.id === productionOrderId
          ? { ...po, measurements: [...po.measurements, newMeas], updatedAt: now }
          : po
      )
    );

    logAudit('ADD_MEASUREMENT', 'ProductionOrder', productionOrderId, `Medição do ambiente ${data.environment} registrada`);
  };

  // ==========================================
  // ESTOQUE & INVENTÁRIO
  // ==========================================
  const registerStockMovement = (
    productId: string,
    type: StockMovement['type'],
    quantity: number,
    reason: string
  ) => {
    if (!reason || reason.trim() === '') {
      throw new Error('É obrigatório informar o motivo para qualquer movimentação de estoque.');
    }

    const now = new Date().toISOString();
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    setStocks((prev) =>
      prev.map((stk) => {
        if (stk.productId === productId) {
          let nextPhysical = stk.physicalStock;
          let nextReserved = stk.reservedStock;

          if (type === 'ENTRADA' || type === 'DEVOLUCAO') {
            nextPhysical = GlassCalculationService.roundMoney(stk.physicalStock + quantity);
          } else if (type === 'SAIDA' || type === 'PERDA' || type === 'AVARIA') {
            nextPhysical = GlassCalculationService.roundMoney(stk.physicalStock - quantity);
          } else if (type === 'AJUSTE') {
            nextPhysical = GlassCalculationService.roundMoney(quantity); // Ajuste define saldo
          }

          const nextAvailable = GlassCalculationService.roundMoney(nextPhysical - nextReserved);

          const mov: StockMovement = {
            id: `mov-${Date.now()}`,
            productId,
            productName: prod.name,
            type,
            quantity,
            previousPhysical: stk.physicalStock,
            nextPhysical,
            previousReserved: stk.reservedStock,
            nextReserved,
            reason,
            userId: currentUser.id,
            userName: currentUser.name,
            createdAt: now,
          };

          setStockMovements((prevM) => [mov, ...prevM]);

          return {
            ...stk,
            physicalStock: nextPhysical,
            availableStock: nextAvailable,
            updatedAt: now,
          };
        }
        return stk;
      })
    );

    logAudit('STOCK_MOVEMENT', 'Product', productId, `Movimentação ${type} de ${quantity} ${prod.unit}. Motivo: ${reason}`);
  };

  const executeInventoryCount = (
    items: Array<{ productId: string; countedQuantity: number; adjustmentReason: string }>
  ) => {
    items.forEach((it) => {
      registerStockMovement(
        it.productId,
        'AJUSTE',
        it.countedQuantity,
        `Inventário Físico: ${it.adjustmentReason}`
      );
    });

    logAudit('INVENTORY_COUNT', 'Inventory', 'inv-batch', `Contagem de inventário executada para ${items.length} itens`);
  };

  const registerMaterialLoss = (
    productId: string,
    quantity: number,
    reason: MaterialLoss['reason'],
    notes?: string,
    orderId?: string
  ) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const newLoss: MaterialLoss = {
      id: `loss-${Date.now()}`,
      productId,
      productName: prod.name,
      quantity,
      reason,
      orderId,
      notes,
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setMaterialLosses((prev) => [newLoss, ...prev]);

    // Dá baixa física no estoque
    registerStockMovement(productId, 'PERDA', quantity, `Registro de Perda (${reason}): ${notes || 'Sem observações'}`);
  };

  // ==========================================
  // FINANCEIRO
  // ==========================================
  const registerPayment = (
    receivableId: string,
    paymentMethodName: string,
    amountPaid: number,
    notes?: string
  ) => {
    const now = new Date().toISOString();

    setReceivables((prev) =>
      prev.map((rec) => {
        if (rec.id === receivableId) {
          const newPaid = GlassCalculationService.roundMoney(rec.paidAmount + amountPaid);
          const newBalance = GlassCalculationService.roundMoney(Math.max(0, rec.originalAmount - newPaid));
          const newStatus: Receivable['status'] = newBalance === 0 ? 'PAGO' : 'PARCIAL';

          const newPaymentRecord: Payment = {
            id: `pay-${Date.now()}`,
            receivableId,
            paymentMethodName,
            amountPaid,
            penaltyAmount: 0,
            discountAmount: 0,
            paymentDate: now,
            notes,
            recordedByUserName: currentUser.name,
          };

          return {
            ...rec,
            paidAmount: newPaid,
            balanceDue: newBalance,
            status: newStatus,
            payments: [...rec.payments, newPaymentRecord],
            updatedAt: now,
          };
        }
        return rec;
      })
    );

    logAudit('RECEIVE_PAYMENT', 'Receivable', receivableId, `Baixa de pagamento de R$ ${amountPaid.toFixed(2)} via ${paymentMethodName}`);
  };

  // ==========================================
  // BUSCA GLOBAL & NOTIFICAÇÕES
  // ==========================================
  const searchGlobal = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return { customers: [], products: [], quotes: [], orders: [] };

    return {
      customers: customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.document.includes(q) ||
          c.phone.includes(q) ||
          c.whatsapp.includes(q)
      ),
      products: products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.internalCode.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      ),
      quotes: quotes.filter(
        (quo) =>
          quo.quoteNumber.toLowerCase().includes(q) ||
          customers.find((c) => c.id === quo.customerId)?.name.toLowerCase().includes(q)
      ),
      orders: orders.filter(
        (ord) =>
          ord.orderNumber.toLowerCase().includes(q) ||
          customers.find((c) => c.id === ord.customerId)?.name.toLowerCase().includes(q)
      ),
    };
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const clearDatabaseToZero = async () => {
    localStorage.setItem('vidrogestao_customers', '[]');
    localStorage.setItem('vidrogestao_products', '[]');
    localStorage.setItem('vidrogestao_services', '[]');
    localStorage.setItem('vidrogestao_suppliers', '[]');
    localStorage.setItem('vidrogestao_quotes', '[]');
    localStorage.setItem('vidrogestao_orders', '[]');
    localStorage.setItem('vidrogestao_stocks', '[]');
    localStorage.setItem('vidrogestao_stock_movements', '[]');
    localStorage.setItem('vidrogestao_production_orders', '[]');
    localStorage.setItem('vidrogestao_receivables', '[]');
    localStorage.setItem('vidrogestao_losses', '[]');
    localStorage.setItem('vidrogestao_audit_logs', '[]');
    localStorage.setItem('vidrogestao_db_zeroed_v3', 'true');

    setCustomers([]);
    setProducts([]);
    setServices([]);
    setSuppliers([]);
    setQuotes([]);
    setOrders([]);
    setStocks([]);
    setStockMovements([]);
    setProductionOrders([]);
    setReceivables([]);
    setMaterialLosses([]);
    setAuditLogs([]);
    setNotifications([]);

    await LocalDatabaseService.clearAllData();
  };

  const resetToSeedData = () => {
    localStorage.clear();
    setCustomers(INITIAL_CUSTOMERS);
    setProducts(INITIAL_PRODUCTS);
    setServices(INITIAL_SERVICES);
    setSuppliers(INITIAL_SUPPLIERS);
    setQuotes(INITIAL_QUOTES);
    setOrders(INITIAL_ORDERS);
    setStocks(INITIAL_STOCKS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setProductionOrders(INITIAL_PRODUCTION_ORDERS);
    setReceivables(INITIAL_RECEIVABLES);
    setMaterialLosses(INITIAL_LOSSES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setCompanySettings({
      name: 'VIDRAÇARIA & ESQUADRIAS',
      tradingName: 'Sua Vidraçaria',
      cnpj: '',
      stateRegistration: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      address: '',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '',
      quotePolicyNotes: 'Vidros de segurança temperados e laminados certificados conforme normas ABNT NBR 14698/14697. Instalação executada por equipe especializada.',
      updatedAt: new Date().toISOString(),
    });
    logAudit('SYSTEM_RESET', 'System', 'all', 'Base restaurada para demonstração inicial');
  };

  return (
    <VidracariaContext.Provider
      value={{
        customers,
        products,
        categories,
        services,
        suppliers,
        paymentMethods,
        quotes,
        orders,
        stocks,
        stockMovements,
        productionOrders,
        receivables,
        materialLosses,
        auditLogs,
        notifications,
        priceHistories,
        companySettings,
        updateCompanySettings,
        saveCustomer,
        deleteCustomer,
        saveProduct,
        updateProductPrice,
        deleteProduct,
        saveService,
        deleteService,
        saveSupplier,
        deleteSupplier,
        createQuote,
        createQuoteVersion,
        approveQuote,
        convertQuoteToOrder,
        updateOrderStatus,
        advanceProductionStep,
        addMeasurement,
        registerStockMovement,
        executeInventoryCount,
        registerMaterialLoss,
        registerPayment,
        searchGlobal,
        markNotificationAsRead,
        clearDatabaseToZero,
        resetToSeedData,
        recordAuditLog: logAudit,
      }}
    >
      {children}
    </VidracariaContext.Provider>
  );
};

export const useVidracaria = () => {
  const context = useContext(VidracariaContext);
  if (!context) throw new Error('useVidracaria deve ser utilizado dentro de VidracariaProvider');
  return context;
};
