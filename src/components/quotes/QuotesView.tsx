import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
  Trash2,
  ChevronRight,
  Calculator,
  ArrowRight,
  ShieldCheck,
  Eye,
  History,
  X,
  Package,
  Wrench,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVidracaria } from '../../context/VidracariaContext';
import { Quote, QuoteItem, QuoteVersion } from '../../types';
import { GlassCalculationService } from '../../services/GlassCalculationService';
import { DiscountPolicyService } from '../../services/DiscountPolicyService';
import { PdfService } from '../../services/PdfService';

interface QuotesViewProps {
  isCreateModalOpen?: boolean;
  onCloseCreateModal?: () => void;
  onNavigateToCompany?: () => void;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  isCreateModalOpen = false,
  onCloseCreateModal,
  onNavigateToCompany,
}) => {
  const { currentUser } = useAuth();
  const {
    quotes,
    customers,
    products,
    services,
    paymentMethods,
    companySettings,
    createQuote,
    createQuoteVersion,
    approveQuote,
    convertQuoteToOrder,
  } = useVidracaria();

  // Estados de Listagem & Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Estados do Modal de Novo Orçamento
  const [showNewModal, setShowNewModal] = useState(isCreateModalOpen);
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [installationAddress, setInstallationAddress] = useState(
    customers[0]?.addresses[0]?.street
      ? `${customers[0].addresses[0].street}, ${customers[0].addresses[0].number}`
      : ''
  );
  const [paymentConditionId, setPaymentConditionId] = useState(
    paymentMethods[0]?.conditions[0]?.id || ''
  );
  const [expectedDays, setExpectedDays] = useState(10);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Itens em construção no orçamento
  const [quoteItems, setQuoteItems] = useState<
    Array<{
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
    }>
  >([]);

  // Item sendo adicionado atualmente
  const [itemType, setItemType] = useState<'PRODUTO' | 'SERVICO'>('PRODUTO');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || '');
  const [widthMm, setWidthMm] = useState<number>(1200);
  const [heightMm, setHeightMm] = useState<number>(1900);
  const [quantity, setQuantity] = useState<number>(1);
  const [lapidationType, setLapidationType] = useState<string>('RETA');
  const [holesCount, setHolesCount] = useState<number>(2);
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Modais de Ação
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sincroniza seleções quando cadastros forem adicionados
  useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0].id);
      if (customers[0].addresses.length > 0) {
        setInstallationAddress(`${customers[0].addresses[0].street}, ${customers[0].addresses[0].number}`);
      }
    }
  }, [customers, customerId]);

  useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  useEffect(() => {
    if (!selectedServiceId && services.length > 0) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Filtragem
  const filteredQuotes = quotes.filter((q) => {
    const cust = customers.find((c) => c.id === q.customerId);
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.document.includes(searchTerm);
    const matchesStatus = statusFilter === 'TODOS' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Atualiza endereço ao selecionar cliente
  const handleCustomerChange = (id: string) => {
    setCustomerId(id);
    const c = customers.find((cust) => cust.id === id);
    if (c && c.addresses.length > 0) {
      setInstallationAddress(`${c.addresses[0].street}, ${c.addresses[0].number} - ${c.addresses[0].neighborhood}, ${c.addresses[0].city}`);
    }
  };

  // Cálculo ao adicionar item de vidro
  const handleAddItem = () => {
    if (itemType === 'PRODUTO') {
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) return;

      let calcResult;
      let finalUnit = prod.unit;
      let area = 0;
      let weight = 0;
      let finishing = '';

      if (prod.unit === 'M2') {
        calcResult = GlassCalculationService.calculatePiece({
          widthMm,
          heightMm,
          thicknessMm: prod.thicknessMm || 8,
          pricePerM2: customPrice > 0 ? customPrice : prod.salePrice,
          quantity,
          lapidationType: lapidationType as any,
          lapidationPricePerMeter: lapidationType !== 'NENHUMA' ? 18.0 : 0,
          holesCount,
          holePrice: 14.0,
        });
        area = calcResult.realAreaM2;
        weight = calcResult.weightKg;
        finishing = `Lapidação: ${lapidationType}${holesCount > 0 ? `, ${holesCount} furo(s)` : ''}`;
      }

      const unitPrice = calcResult ? calcResult.unitPrice : customPrice > 0 ? customPrice : prod.salePrice;

      setQuoteItems((prev) => [
        ...prev,
        {
          itemType: 'PRODUTO',
          productId: prod.id,
          code: prod.internalCode,
          description: prod.name,
          unit: finalUnit,
          widthMm: prod.unit === 'M2' ? widthMm : undefined,
          heightMm: prod.unit === 'M2' ? heightMm : undefined,
          areaM2: area > 0 ? area : undefined,
          weightKg: weight > 0 ? weight : undefined,
          finishingDetails: finishing || undefined,
          quantity,
          unitPrice,
          discountAmount: 0,
        },
      ]);
    } else {
      const srv = services.find((s) => s.id === selectedServiceId);
      if (!srv) return;

      setQuoteItems((prev) => [
        ...prev,
        {
          itemType: 'SERVICO',
          serviceId: srv.id,
          code: srv.code,
          description: srv.name,
          unit: srv.unit,
          quantity,
          unitPrice: customPrice > 0 ? customPrice : srv.salePrice,
          discountAmount: 0,
        },
      ]);
    }

    // Reset de campos secundários
    setQuantity(1);
    setCustomPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Subtotal preliminar do modal de novo orçamento
  const modalSubtotal = quoteItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountVal = (modalSubtotal * discountPercent) / 100;
  const modalTotal = modalSubtotal - discountVal + freightAmount;

  // Validação de alçada de desconto
  const discountPolicy = DiscountPolicyService.validateDiscount(currentUser.role, discountPercent);

  const handleSaveQuote = () => {
    setErrorMessage('');
    if (quoteItems.length === 0) {
      setErrorMessage('Adicione pelo menos um item (produto ou serviço) ao orçamento.');
      return;
    }
    if (!discountPolicy.isValid) {
      setErrorMessage(discountPolicy.message);
      return;
    }

    try {
      const created = createQuote({
        customerId,
        expectedDeliveryDays: expectedDays,
        installationAddress,
        paymentConditionId,
        discountPercent,
        freightAmount,
        notes,
        items: quoteItems,
      });

      setShowNewModal(false);
      setQuoteItems([]);
      setSelectedQuote(created);
      if (onCloseCreateModal) onCloseCreateModal();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao gerar orçamento.');
    }
  };

  // Gerar PDF do orçamento selecionado
  const handleDownloadPdf = (quote: Quote) => {
    const cust = customers.find((c) => c.id === quote.customerId);
    if (!cust) return;
    PdfService.generateQuotePdf(quote, cust, currentUser, companySettings);
  };

  // Aprovação interna pelo vendedor
  const handleConfirmApproval = () => {
    if (!selectedQuote) return;
    approveQuote(selectedQuote.id, approvalNotes);
    setShowApprovalModal(false);
    setApprovalNotes('');
    // Atualiza visualmente o selecionado
    const updated = quotes.find((q) => q.id === selectedQuote.id);
    if (updated) setSelectedQuote({ ...updated, status: 'APROVADO' });
  };

  // Conversão em Pedido
  const handleConvertToOrder = () => {
    if (!selectedQuote) return;
    try {
      const newOrder = convertQuoteToOrder(selectedQuote.id);
      alert(`Orçamento convertido com sucesso no Pedido #${newOrder.orderNumber}! A ordem de produção e o financeiro foram gerados.`);
      setSelectedQuote(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Criação de nova versão
  const handleCreateNewVersion = () => {
    if (!selectedQuote) return;
    try {
      createQuoteVersion(selectedQuote.id, newVersionNotes || 'Revisão comercial negociada');
      setShowNewVersionModal(false);
      setNewVersionNotes('');
      const updated = quotes.find((q) => q.id === selectedQuote.id);
      if (updated) setSelectedQuote(updated);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestão Comercial & Orçamentos</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Elaboração com cálculo técnico de vidros, alçadas de desconto, versionamento e exportação para WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCompany && (
            <button
              onClick={onNavigateToCompany}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Configurar nome da loja, CNPJ, telefones e contatos que saem no cabeçalho do PDF"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Dados da Loja no PDF</span>
            </button>
          )}

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do orçamento, nome do cliente ou documento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="EM_NEGOCIACAO">Em Negociação</option>
            <option value="APROVADO">Aprovados</option>
            <option value="ENVIADO">Enviados</option>
            <option value="RECUSADO">Recusados</option>
            <option value="CANCELADO">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Orçamento</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Emissão</th>
                <th className="py-3 px-4">Validade</th>
                <th className="py-3 px-4">Total Líquido</th>
                <th className="py-3 px-4">Versão</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-600">
                    Nenhum orçamento encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const cust = customers.find((c) => c.id === q.customerId);
                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        selectedQuote?.id === q.id ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-blue-700">
                        {q.quoteNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{cust?.name}</p>
                        <p className="text-[11px] text-slate-600">{cust?.phone || cust?.whatsapp}</p>
                      </td>
                      <td className="py-3 px-4">
                        {new Date(q.issueDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(q.validUntil).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        R$ {q.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                          v{q.currentVersion}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            q.status === 'APROVADO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.status === 'EM_NEGOCIACAO'
                              ? 'bg-amber-100 text-amber-800'
                              : q.status === 'CANCELADO'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDownloadPdf(q)}
                            title="Baixar PDF Comercial para WhatsApp"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedQuote(q)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gaveta / Modal de Detalhes do Orçamento Selecionado */}
      {selectedQuote && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">
                  {selectedQuote.quoteNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedQuote.status === 'APROVADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedQuote.status}
                </span>
                <span className="text-xs text-slate-700 font-medium">
                  Versão {selectedQuote.currentVersion} de {selectedQuote.versions.length}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Cliente: <strong>{customers.find((c) => c.id === selectedQuote.customerId)?.name}</strong> • Instalação: {selectedQuote.installationAddress || 'Balcão'}
              </p>
            </div>

            {/* Ações do Orçamento */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPdf(selectedQuote)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Gerar PDF (WhatsApp)</span>
              </button>

              {selectedQuote.status !== 'APROVADO' && selectedQuote.status !== 'CANCELADO' && (
                <>
                  <button
                    onClick={() => setShowNewVersionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <History className="w-4 h-4 text-amber-600" />
                    <span>Nova Versão</span>
                  </button>

                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Registrar Aprovação do Cliente</span>
                  </button>
                </>
              )}

              {selectedQuote.status === 'APROVADO' && (
                <button
                  onClick={handleConvertToOrder}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>CONVERTER EM PEDIDO</span>
                </button>
              )}

              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Indicador de Cabeçalho do PDF Ativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Cabeçalho do PDF: <strong className="text-slate-800">{companySettings.name}</strong> (CNPJ: {companySettings.cnpj} | Tel: {companySettings.whatsapp || companySettings.phone})
              </span>
            </div>
            {onNavigateToCompany && (
              <button
                onClick={onNavigateToCompany}
                className="text-blue-600 hover:text-blue-800 font-bold text-[11px] underline cursor-pointer shrink-0 text-left sm:text-right"
              >
                Editar dados da loja
              </button>
            )}
          </div>

          {/* Dados de Aprovação se houver */}
          {selectedQuote.status === 'APROVADO' && selectedQuote.approvedAt && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-emerald-900">
                  Orçamento Aprovado Internamente em {new Date(selectedQuote.approvedAt).toLocaleString('pt-BR')}
                </p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Obs: {selectedQuote.approvalNotes || 'Aprovação comunicada pelo cliente.'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold rounded text-[10px]">
                PRONTO PARA PEDIDO
              </span>
            </div>
          )}

          {/* Tabela de Itens da Versão Ativa */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Composição de Materiais e Serviços (Versão {selectedQuote.currentVersion})
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Descrição Técnica</th>
                    <th className="py-2.5 px-3">Medidas ($L \times A$)</th>
                    <th className="py-2.5 px-3">Área ($m^2$)</th>
                    <th className="py-2.5 px-3">Qtd</th>
                    <th className="py-2.5 px-3">Unitário</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(
                    selectedQuote.versions.find((v) => v.versionNumber === selectedQuote.currentVersion) ||
                    selectedQuote.versions[0]
                  )?.items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            it.itemType === 'PRODUTO'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {it.itemType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold">{it.code}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900 uppercase text-xs tracking-wide">{it.description}</p>
                        {it.finishingDetails && (
                          <p className="text-[11px] text-slate-600 font-medium italic uppercase mt-0.5">ACABAMENTO: {it.finishingDetails}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {it.widthMm && it.heightMm ? `${it.widthMm} x ${it.heightMm} mm` : '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        {it.areaM2 ? `${it.areaM2.toFixed(3)} m²` : '-'}
                      </td>
                      <td className="py-2.5 px-3 font-bold">{it.quantity} {it.unit}</td>
                      <td className="py-2.5 px-3">R$ {it.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        R$ {it.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Consolidação de Valores */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="space-y-1 text-slate-600">
                <p>Condição: <strong>À vista no PIX (com desconto padrão) ou Parcelado</strong></p>
                <p>Entrega prevista: <strong>{selectedQuote.expectedDeliveryDays} dias úteis</strong></p>
              </div>

              <div className="w-full sm:w-64 space-y-1 text-right mt-3 sm:mt-0">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>R$ {selectedQuote.subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Desconto Comercial ({selectedQuote.discountPercent}%):</span>
                  <span className="text-red-600">- R$ {selectedQuote.discountAmount.toFixed(2)}</span>
                </div>
                {selectedQuote.freightAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Frete / Instalação:</span>
                    <span>+ R$ {selectedQuote.freightAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-blue-900 pt-1 border-t border-slate-200">
                  <span>VALOR TOTAL:</span>
                  <span>R$ {selectedQuote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO ORÇAMENTO COM CALCULADORA TÉCNICA DE VIDRO */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Novo Orçamento Técnico Especializado</h2>
                  <p className="text-[11px] text-slate-300">
                    Calculadora de chapas por $m^2$, acabamentos, alçadas e condições comerciais
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Seleção de Cliente e Endereço */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {customers.length === 0 ? (
                      <option value="">Nenhum cliente cadastrado ainda (cadastre na aba Clientes)</option>
                    ) : (
                      customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type} - {c.document})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Local da Instalação / Obra
                  </label>
                  <input
                    type="text"
                    value={installationAddress}
                    onChange={(e) => setInstallationAddress(e.target.value)}
                    placeholder="Ex: Alameda Lorena, 1450 - Apto 82"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* 2. Adição de Itens com Calculadora Técnica */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Inserir Material ou Serviço</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemType('PRODUTO')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        itemType === 'PRODUTO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Produto / Vidro
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemType('SERVICO')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        itemType === 'SERVICO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Serviço
                    </button>
                  </div>
                </div>

                {itemType === 'PRODUTO' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Selecionar Produto / Vidro do Catálogo
                        </label>
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        >
                          {products.length === 0 ? (
                            <option value="">Nenhum produto cadastrado (cadastre na aba Produtos & Vidros)</option>
                          ) : (
                            products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.internalCode}) - R$ {p.salePrice.toFixed(2)} / {p.unit}
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Quantidade de Peças
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Campos Técnicos se for vidro em M² */}
                    {products.find((p) => p.id === selectedProductId)?.unit === 'M2' && (
                      <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Largura ($mm$)
                          </label>
                          <input
                            type="number"
                            value={widthMm}
                            onChange={(e) => setWidthMm(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Altura ($mm$)
                          </label>
                          <input
                            type="number"
                            value={heightMm}
                            onChange={(e) => setHeightMm(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-800"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Lapidação / Acabamento
                          </label>
                          <select
                            value={lapidationType}
                            onChange={(e) => setLapidationType(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-800"
                          >
                            <option value="RETA">Lapidação Reta (4 lados)</option>
                            <option value="BISOTE">Bisotê 25mm</option>
                            <option value="CANTO_MOEDA">Cantos Moeda</option>
                            <option value="NENHUMA">Corte Cru (Sem lapidação)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Furos / Recortes
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={holesCount}
                            onChange={(e) => setHolesCount(Number(e.target.value))}
                            className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded-lg text-slate-800"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Inserção de Serviço */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Serviço
                      </label>
                      <select
                        value={selectedServiceId}
                        onChange={(e) => setSelectedServiceId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      >
                        {services.length === 0 ? (
                          <option value="">Nenhum serviço cadastrado (cadastre na aba Serviços)</option>
                        ) : (
                          services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code}) - R$ {s.salePrice.toFixed(2)} / {s.unit}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Qtd / Metragem
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar ao Orçamento</span>
                  </button>
                </div>
              </div>

              {/* Tabela de Itens Adicionados */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Itens Inclusos ({quoteItems.length})
                </span>

                {quoteItems.length === 0 ? (
                  <p className="text-xs text-slate-600 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum item adicionado ainda. Configure acima e clique em "Adicionar ao Orçamento".
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Item</th>
                          <th className="py-2 px-3">Medidas</th>
                          <th className="py-2 px-3">Qtd</th>
                          <th className="py-2 px-3">Unitário</th>
                          <th className="py-2 px-3">Total</th>
                          <th className="py-2 px-3 text-right">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quoteItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3">
                              <p className="font-bold text-slate-900 uppercase text-xs tracking-wide">{it.description}</p>
                              {it.finishingDetails && (
                                <p className="text-[11px] text-slate-600 font-medium italic uppercase mt-0.5">ACABAMENTO: {it.finishingDetails}</p>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {it.widthMm ? `${it.widthMm}x${it.heightMm}mm (${it.areaM2}m²)` : '-'}
                            </td>
                            <td className="py-2 px-3 font-bold">{it.quantity} {it.unit}</td>
                            <td className="py-2 px-3">R$ {it.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              R$ {(it.quantity * it.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 3. Condições Comerciais, Desconto & Alçada */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condição de Pagamento
                  </label>
                  <select
                    value={paymentConditionId}
                    onChange={(e) => setPaymentConditionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {paymentMethods.flatMap((pm) =>
                      pm.conditions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {pm.name} - {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Desconto Comercial (%)
                    </label>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      Sua alçada: {currentUser.maxDiscountPercent}%
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={currentUser.maxDiscountPercent}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    className={`w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl font-bold ${
                      !discountPolicy.isValid ? 'border-red-500 text-red-600' : 'border-slate-200'
                    }`}
                  />
                  {!discountPolicy.isValid && (
                    <p className="text-[10px] text-red-600 font-medium mt-1">
                      {discountPolicy.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Frete / Deslocamento (R$)
                  </label>
                  <input
                    type="number"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Totalizador Final */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-400">Subtotal: R$ {modalSubtotal.toFixed(2)} | Desconto: -R$ {discountVal.toFixed(2)}</p>
                  <p className="text-lg font-black text-white mt-0.5">
                    TOTAL ESTIMADO: <span className="text-cyan-400">R$ {modalTotal.toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowNewModal(false);
                      if (onCloseCreateModal) onCloseCreateModal();
                    }}
                    className="px-4 py-2 text-xs text-slate-300 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveQuote}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
                  >
                    Emitir Orçamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR APROVAÇÃO INTERNA DO CLIENTE (SEM ACEITE DIGITAL) */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registrar Aceite do Cliente</h3>
                <p className="text-xs text-slate-600">Aprovação comercial manual (via WhatsApp/Telefone)</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Conforme as diretrizes, o sistema <strong>não possui aceite digital público</strong>. O vendedor registra internamente a confirmação verbal ou escrita recebida do cliente.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações do Contato / Aceite
              </label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Cliente aceitou via mensagem de WhatsApp às 14:20. Solicitou entrega para o dia 25."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20"
              >
                Confirmar Status: APROVADO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVA VERSÃO / REVISÃO */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Gerar Nova Versão do Orçamento</h3>
            <p className="text-xs text-slate-600">
              Cria uma revisão (v{(selectedQuote?.currentVersion || 1) + 1}) mantendo o histórico da versão anterior intacto.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo da Revisão
              </label>
              <input
                type="text"
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder="Ex: Cliente solicitou substituição de vidro 8mm para 10mm"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewVersion}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Criar Revisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
