export type UserRoleType =
  | 'ADMINISTRADOR'
  | 'GERENTE'
  | 'VENDEDOR'
  | 'ESTOQUISTA'
  | 'PRODUCAO'
  | 'FINANCEIRO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRoleType;
  maxDiscountPercent: number; // Ex: 5 para Vendedor, 10 para Gerente, 100 para Admin
  isActive: boolean;
  avatarUrl?: string;
  password?: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
}

export type CustomerType = 'PF' | 'PJ' | 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
export type AddressType = 'RESIDENCIAL' | 'COMERCIAL' | 'ENTREGA' | 'INSTALACAO' | 'PRINCIPAL';

export interface CustomerAddress {
  id: string;
  customerId: string;
  type: AddressType;
  zipCode?: string;
  postalCode?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  type: CustomerType;
  name: string; // Nome completo ou Razão Social
  tradeName?: string; // Nome Fantasia
  document: string; // CPF ou CNPJ
  stateRegistration?: string; // RG ou IE
  phone: string;
  whatsapp: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  addresses: CustomerAddress[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Supplier {
  id: string;
  tradeName: string;
  companyName: string;
  document?: string;
  cnpj?: string;
  contactName?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  deletedAt?: string | null;
}

export type UnitOfMeasure = 'UN' | 'M' | 'ML' | 'M2' | 'KG' | 'L' | 'CX' | 'KIT' | 'SERV';

export type ProductKind =
  | 'VIDRO'
  | 'VIDRO_TEMPERADO'
  | 'VIDRO_LAMINADO'
  | 'VIDRO_COMUM'
  | 'ESPELHO'
  | 'PERFIL_ALUMINIO'
  | 'FERRAGEM'
  | 'KIT'
  | 'KIT_BOX'
  | 'ACESSORIO'
  | 'CONSUMIVEL'
  | 'INSUMO';

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  oldCost?: number;
  newCost?: number;
  userId: string;
  userName: string;
  reason: string;
  changedAt: string;
}

export interface Product {
  id: string;
  internalCode: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  supplierId?: string;
  kind: ProductKind;
  unit: UnitOfMeasure;
  
  // Detalhes técnicos de Vidro
  glassType?: string; // Temperado, Laminado, Aramado, Float
  thicknessMm?: number; // 4, 6, 8, 10, 12, etc.
  color?: string; // Incolor, Fumê, Verde, Bronze, Astral
  treatment?: string; // Lapidação, Bisotê
  isManufactured?: boolean; // Se exige corte e beneficiamento sob medida

  costPrice: number;
  salePrice: number;
  minPrice?: number;
  marginPercent?: number;

  minStockAlert: number;
  maxStockLimit?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description?: string;
  unit: UnitOfMeasure;
  costPrice: number;
  salePrice: number;
  isActive: boolean;
  createdAt: string;
  deletedAt?: string | null;
}

export interface PaymentCondition {
  id: string;
  paymentMethodId: string;
  name: string;
  installments: number;
  discountPercent: number; // Ex: 5% no PIX à vista
  surchargePercent: number; // Ex: juros em parcelamento
  intervalDays: number;
  isActive: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string; // 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO'
  isActive: boolean;
  conditions: PaymentCondition[];
}

export type QuoteStatus =
  | 'RASCUNHO'
  | 'EM_NEGOCIACAO'
  | 'ENVIADO'
  | 'APROVADO'
  | 'RECUSADO'
  | 'EXPIRADO'
  | 'CANCELADO';

export interface QuoteItem {
  id: string;
  quoteVersionId: string;
  itemOrder: number;
  itemType: 'PRODUTO' | 'SERVICO';
  productId?: string;
  serviceId?: string;

  // Snapshot comercial
  code: string;
  description: string;
  unit: UnitOfMeasure;

  // Medidas específicas para Vidraçaria
  widthMm?: number;
  heightMm?: number;
  areaM2?: number;
  weightKg?: number;
  finishingDetails?: string; // Ex: Lapidação reta 4 lados + 2 furos puxador

  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export interface QuoteVersion {
  id: string;
  quoteId: string;
  versionNumber: number;
  subtotalAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  freightAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  items: QuoteItem[];
}

export interface Quote {
  id: string;
  quoteNumber: string; // Ex: ORC-2026-001001
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  customerDocument?: string;
  userId: string; // Vendedor
  sellerName?: string; // Nome do vendedor inserido manualmente
  currentVersion: number;
  status: QuoteStatus;

  issueDate: string;
  validUntil: string;
  expectedDeliveryDays: number;

  deliveryAddress?: string;
  installationAddress?: string;
  paymentConditionId?: string;

  // Valores consolidados da versão atual
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  surchargeAmount: number;
  freightAmount: number;
  totalAmount: number;

  notes?: string;
  approvalNotes?: string;
  approvedAt?: string;
  approvedByUserId?: string;

  versions: QuoteVersion[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type OrderStatus =
  | 'AGUARDANDO_PRODUCAO'
  | 'EM_PRODUCAO'
  | 'PRONTO'
  | 'EM_INSTALACAO'
  | 'ENTREGUE'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface OrderItem {
  id: string;
  orderId: string;
  itemType: 'PRODUTO' | 'SERVICO';
  productId?: string;
  serviceId?: string;
  code: string;
  description: string;
  unit: UnitOfMeasure;
  widthMm?: number;
  heightMm?: number;
  areaM2?: number;
  weightKg?: number;
  finishingDetails?: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: PED-2026-000842
  quoteId: string;
  approvedQuoteVer: number;
  customerId: string;
  userId: string; // Vendedor
  status: OrderStatus;

  orderDate: string;
  promisedDeliveryDate?: string;
  actualDeliveryDate?: string;

  deliveryAddress?: string;
  installationAddress?: string;
  paymentConditionId?: string;

  subtotalAmount: number;
  discountAmount: number;
  surchargeAmount: number;
  freightAmount: number;
  totalAmount: number;

  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// ESTOQUE
export interface Stock {
  productId: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number; // physicalStock - reservedStock
  locationCode?: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'ENTRADA'
  | 'SAIDA'
  | 'RESERVA'
  | 'CANCELAMENTO_RESERVA'
  | 'PERDA'
  | 'AVARIA'
  | 'AJUSTE'
  | 'DEVOLUCAO';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousPhysical: number;
  nextPhysical: number;
  previousReserved: number;
  nextReserved: number;
  orderId?: string;
  reason: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface StockReservation {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  isFulfilled: boolean;
  createdAt: string;
}

export interface InventoryCountItem {
  productId: string;
  productName: string;
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  adjustmentReason: string;
}

export interface InventoryCount {
  id: string;
  countDate: string;
  userId: string;
  userName: string;
  notes?: string;
  status: 'EM_ANDAMENTO' | 'CONCLUIDO';
  items: InventoryCountItem[];
}

export type MaterialLossReason =
  | 'QUEBRA'
  | 'ERRO_CORTE'
  | 'AVARIA'
  | 'DEFEITO_FABRICANTE'
  | 'SOBRA_DESCARTE'
  | 'OUTROS';

export interface MaterialLoss {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: MaterialLossReason;
  orderId?: string;
  productionOrderId?: string;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: string;
}

// PRODUÇÃO & MEDIÇÃO
export type ProductionStage =
  | 'MEDICAO'
  | 'PROJETO'
  | 'CORTE'
  | 'BENEFICIAMENTO'
  | 'MONTAGEM'
  | 'EXPEDICAO'
  | 'INSTALACAO'
  | 'CONCLUIDO';

export type ProductionStepStatus =
  | 'PENDENTE'
  | 'EM_ANDAMENTO'
  | 'CONCLUIDO'
  | 'BLOQUEADO';

export interface ProductionStep {
  id: string;
  productionOrderId: string;
  stage: ProductionStage;
  status: ProductionStepStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  attachments: string[];
}

export interface Measurement {
  id: string;
  productionOrderId: string;
  environment: string; // Ex: Sacada, Banheiro Suíte, Fachada
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  thicknessMm?: number;
  glassType?: string;
  color?: string;
  notes?: string;
  photos: string[];
  measuredByUserId: string;
  measuredByUserName: string;
  measuredAt: string;
}

export interface ProductionOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  currentStage: ProductionStage;
  startDate?: string;
  completionDate?: string;
  notes?: string;
  steps: ProductionStep[];
  measurements: Measurement[];
  createdAt: string;
  updatedAt: string;
}

// FINANCEIRO
export type ReceivableStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'PARCIAL' | 'CANCELADO';

export interface Payment {
  id: string;
  receivableId: string;
  paymentMethodName: string;
  amountPaid: number;
  penaltyAmount: number;
  discountAmount: number;
  paymentDate: string;
  receiptDocUrl?: string;
  notes?: string;
  recordedByUserName: string;
}

export interface Receivable {
  id: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  installmentNum: number;
  totalInstallments: number;
  originalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  status: ReceivableStatus;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export type CommissionStatus = 'PENDENTE' | 'LIBERADA' | 'PAGA' | 'CANCELADA';

export interface Commission {
  id: string;
  userId: string;
  userName: string;
  orderId: string;
  orderNumber: string;
  baseAmount: number;
  percent: number;
  commissionAmount: number;
  status: CommissionStatus;
  paidAt?: string;
  createdAt: string;
}

// AUDITORIA & NOTIFICAÇÃO
export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRoleType;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  details?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  targetRole?: UserRoleType;
  title: string;
  message: string;
  type: 'INFO' | 'AVISO' | 'URGENTE' | 'SUCESSO';
  linkTab?: string;
  isRead: boolean;
  createdAt: string;
}

export interface CompanySettings {
  name: string;
  tradingName?: string;
  cnpj: string;
  stateRegistration?: string;
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  quotePolicyNotes?: string;
  updatedAt?: string;
}

