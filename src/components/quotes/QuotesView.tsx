/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  Calculator,
  ArrowRight,
  Eye,
  History,
  X,
  Package,
  Wrench,
  Building2,
  User,
  Phone,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVidracaria } from '../../context/VidracariaContext';
import { Quote, QuoteItem, UnitOfMeasure } from '../../types';
import { GlassCalculationService } from '../../services/GlassCalculationService';
import { DiscountPolicyService } from '../../services/DiscountPolicyService';
import { PdfService } from '../../services/PdfService';
import { maskPhone, maskCpfCnpj } from '../../utils/masks';

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

  // Estados do Modal de Novo Orçamento (DADOS MANUAIS)
  const [showNewModal, setShowNewModal] = useState(isCreateModalOpen);
  const [customerName, setCustomerName] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [installationAddress, setInstallationAddress] = useState('');
  const [expectedDays, setExpectedDays] = useState(10);
  const [paymentConditionId, setPaymentConditionId] = useState(
    paymentMethods[0]?.conditions[0]?.id || ''
  );
  const [discountPercent, setDiscountPercent] = useState(0);
  const [freightAmount, setFreightAmount] = useState(0);
  const [notes, setNotes] = useState('');

  // Itens em construção no orçamento
  const [quoteItems, setQuoteItems] = useState<
    Array<{
      itemType: 'PRODUTO' | 'SERVICO';
      code: string;
      description: string;
      unit: UnitOfMeasure;
      widthMm?: number;
      heightMm?: number;
      areaM2?: number;
      finishingDetails?: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
    }>
  >([]);

  // Campos do item sendo inserido manualmente
  const [itemCategory, setItemCategory] = useState<'VIDRO' | 'OUTRO'>('VIDRO');
  const [itemDescription, setItemDescription] = useState('');
  const [itemUnit, setItemUnit] = useState<UnitOfMeasure>('M2');
  const [widthMm, setWidthMm] = useState<number>(1000);
  const [heightMm, setHeightMm] = useState<number>(2000);
  const [pricingMode, setPricingMode] = useState<'M2' | 'TOTAL'>('M2');
  const [pricePerM2, setPricePerM2] = useState<number>(240);
  const [manualPrice, setManualPrice] = useState<number>(480);
  const [quantity, setQuantity] = useState<number>(1);
  const [finishingDetails, setFinishingDetails] = useState('');

  // Modais de Ação
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isCreateModalOpen) {
      setShowNewModal(true);
    }
  }, [isCreateModalOpen]);

  // Cálculo da área da peça em tempo real
  const currentAreaM2 = GlassCalculationService.roundArea(
    (Math.max(10, widthMm) * Math.max(10, heightMm)) / 1000000
  );

  // Preço unitário calculado para o item em edição
  const calculatedUnitPrice =
    itemCategory === 'VIDRO'
      ? pricingMode === 'M2'
        ? GlassCalculationService.roundMoney(currentAreaM2 * pricePerM2)
        : manualPrice
      : manualPrice;

  // Atualiza preço manual estimado quando mudar m²
  useEffect(() => {
    if (itemCategory === 'VIDRO' && pricingMode === 'M2') {
      setManualPrice(GlassCalculationService.roundMoney(currentAreaM2 * pricePerM2));
    }
  }, [currentAreaM2, pricePerM2, pricingMode, itemCategory]);

  // Filtragem de orçamentos
  const filteredQuotes = quotes.filter((q) => {
    const cust = customers.find((c) => c.id === q.customerId);
    const clientName = q.customerName || cust?.name || '';
    const clientDoc = q.customerDocument || cust?.document || '';
    const clientPhone = q.customerPhone || cust?.phone || cust?.whatsapp || '';
    const matchesSearch =
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientDoc.includes(searchTerm) ||
      clientPhone.includes(searchTerm);
    const matchesStatus = statusFilter === 'TODOS' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Adicionar item manual à lista do orçamento
  const handleAddItem = () => {
    setErrorMessage('');
    if (!itemDescription.trim()) {
      setErrorMessage('Informe a descrição do item.');
      return;
    }

    const unitPrice = calculatedUnitPrice > 0 ? calculatedUnitPrice : manualPrice;
    if (unitPrice <= 0) {
      setErrorMessage('O valor unitário deve ser maior que zero.');
      return;
    }

    setQuoteItems((prev) => [
      ...prev,
      {
        itemType: itemCategory === 'VIDRO' ? 'PRODUTO' : 'SERVICO',
        code: `ITEM-${String(prev.length + 1).padStart(2, '0')}`,
        description: itemDescription.trim(),
        unit: itemCategory === 'VIDRO' ? 'M2' : itemUnit,
        widthMm: itemCategory === 'VIDRO' ? widthMm : undefined,
        heightMm: itemCategory === 'VIDRO' ? heightMm : undefined,
        areaM2: itemCategory === 'VIDRO' ? currentAreaM2 : undefined,
        finishingDetails: itemCategory === 'VIDRO' && finishingDetails.trim() ? finishingDetails.trim() : undefined,
        quantity: Math.max(1, quantity),
        unitPrice: GlassCalculationService.roundMoney(unitPrice),
        discountAmount: 0,
      },
    ]);

    // Reset para novo item
    setQuantity(1);
    setItemDescription('');
    setFinishingDetails('');
  };

  const handleRemoveItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Subtotal do modal
  const modalSubtotal = quoteItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountVal = (modalSubtotal * discountPercent) / 100;
  const modalTotal = modalSubtotal - discountVal + freightAmount;

  // Validação de alçada de desconto
  const discountPolicy = DiscountPolicyService.validateDiscount(currentUser.role, discountPercent);

  // Salvar novo orçamento
  const handleSaveQuote = () => {
    setErrorMessage('');
    if (!customerName.trim()) {
      setErrorMessage('Por favor, informe o Nome do Cliente.');
      return;
    }
    if (quoteItems.length === 0) {
      setErrorMessage('Adicione pelo menos um item ao orçamento.');
      return;
    }
    if (!discountPolicy.isValid) {
      setErrorMessage(discountPolicy.message);
      return;
    }

    try {
      const created = createQuote({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerDocument: customerDocument.trim(),
        sellerName: sellerName.trim() || undefined,
        installationAddress: installationAddress.trim(),
        expectedDeliveryDays: expectedDays,
        paymentConditionId,
        discountPercent,
        freightAmount,
        notes: notes.trim(),
        items: quoteItems,
      });

      setShowNewModal(false);
      setQuoteItems([]);
      setCustomerName('');
      setSellerName('');
      setCustomerPhone('');
      setCustomerDocument('');
      setInstallationAddress('');
      setNotes('');
      setSelectedQuote(created);
      if (onCloseCreateModal) onCloseCreateModal();
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao gerar orçamento.');
    }
  };

  // Gerar PDF oficial
  const handleDownloadPdf = (quote: Quote) => {
    const cust = customers.find((c) => c.id === quote.customerId);
    const effectiveCust = cust || {
      id: quote.customerId || 'manual',
      type: (quote.customerDocument && quote.customerDocument.length > 14 ? 'PJ' : 'PF') as any,
      name: quote.customerName || 'Consumidor',
      document: quote.customerDocument || '',
      phone: quote.customerPhone || '',
      whatsapp: quote.customerPhone || '',
      email: '',
      addresses: [],
      creditLimit: 0,
      usedCredit: 0,
      priceTable: 'PADRAO' as any,
      status: 'ATIVO' as any,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
    const effectiveSeller = {
      ...currentUser,
      name: quote.sellerName || currentUser.name || 'Vendedor',
    };
    PdfService.generateQuotePdf(quote, effectiveCust, effectiveSeller, companySettings);
  };

  // Aprovação interna
  const handleConfirmApproval = () => {
    if (!selectedQuote) return;
    approveQuote(selectedQuote.id, approvalNotes);
    setShowApprovalModal(false);
    setApprovalNotes('');
    const updated = quotes.find((q) => q.id === selectedQuote.id);
    if (updated) setSelectedQuote({ ...updated, status: 'APROVADO' });
  };

  // Conversão em Pedido
  const handleConvertToOrder = () => {
    if (!selectedQuote) return;
    try {
      const newOrder = convertQuoteToOrder(selectedQuote.id);
      alert(
        `Orçamento convertido com sucesso no Pedido #${newOrder.orderNumber}! A ordem de produção e o financeiro foram gerados.`
      );
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
      {/* Topo / Cabeçalho Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Orçamentos de Vidraçaria</span>
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Crie orçamentos rápidos digitando as medidas e materiais diretamente, sem necessidade de cadastros prévios
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToCompany && (
            <button
              onClick={onNavigateToCompany}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all cursor-pointer"
              title="Configurar nome da vidraçaria, CNPJ, telefones e contatos que saem no cabeçalho do PDF"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Dados da Loja no PDF</span>
            </button>
          )}

          <button
            onClick={() => {
              setErrorMessage('');
              setShowNewModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Orçamento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros & Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do orçamento, nome do cliente, telefone ou documento..."
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
                <th className="py-3 px-4">Vendedor</th>
                <th className="py-3 px-4">WhatsApp / Fone</th>
                <th className="py-3 px-4">Emissão</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Versão</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">Nenhum orçamento encontrado.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Clique em <strong>Novo Orçamento</strong> para criar sua primeira proposta.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const cust = customers.find((c) => c.id === q.customerId);
                  const displayClient = q.customerName || cust?.name || 'Cliente';
                  const displayPhone = q.customerPhone || cust?.whatsapp || cust?.phone || '-';

                  return (
                    <tr
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        selectedQuote?.id === q.id ? 'bg-blue-50/70' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-blue-700">{q.quoteNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{displayClient}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">{q.sellerName || 'Vendas'}</td>
                      <td className="py-3 px-4 text-slate-600">{displayPhone}</td>
                      <td className="py-3 px-4">
                        {new Date(q.issueDate).toLocaleDateString('pt-BR')}
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
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleDownloadPdf(q)}
                            title="Baixar PDF Comercial para WhatsApp"
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedQuote(q)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
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

      {/* Gaveta / Detalhes do Orçamento Selecionado */}
      {selectedQuote && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-slate-900">{selectedQuote.quoteNumber}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedQuote.status === 'APROVADO'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedQuote.status}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Versão {selectedQuote.currentVersion} de {selectedQuote.versions.length}
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1">
                Cliente: <strong>{selectedQuote.customerName || customers.find((c) => c.id === selectedQuote.customerId)?.name || 'Consumidor'}</strong>
                {selectedQuote.sellerName && (
                  <span> • Vendedor: <strong className="text-slate-900">{selectedQuote.sellerName}</strong></span>
                )}
                {selectedQuote.customerPhone && ` • WhatsApp: ${selectedQuote.customerPhone}`}
                {selectedQuote.installationAddress && ` • Instalação: ${selectedQuote.installationAddress}`}
              </p>
            </div>

            {/* Ações do Orçamento */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleDownloadPdf(selectedQuote)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Gerar PDF (WhatsApp)</span>
              </button>

              {selectedQuote.status !== 'APROVADO' && selectedQuote.status !== 'CANCELADO' && (
                <>
                  <button
                    onClick={() => setShowNewVersionModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <History className="w-4 h-4 text-amber-600" />
                    <span>Nova Versão</span>
                  </button>

                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Registrar Aceite do Cliente</span>
                  </button>
                </>
              )}

              {selectedQuote.status === 'APROVADO' && (
                <button
                  onClick={handleConvertToOrder}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>CONVERTER EM PEDIDO</span>
                </button>
              )}

              <button
                onClick={() => setSelectedQuote(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabela de Itens da Versão Ativa */}
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Composição dos Materiais e Medidas (Versão {selectedQuote.currentVersion})
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200 text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
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
                      <td className="py-2.5 px-3 font-semibold text-slate-500">{it.code}</td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900 uppercase text-xs tracking-wide">{it.description}</p>
                        {it.finishingDetails && (
                          <p className="text-[11px] text-slate-500 font-medium italic uppercase mt-0.5">
                            ACABAMENTO: {it.finishingDetails}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {it.widthMm && it.heightMm ? `${it.widthMm} x ${it.heightMm} mm` : '-'}
                      </td>
                      <td className="py-2.5 px-3">{it.areaM2 ? `${it.areaM2.toFixed(3)} m²` : '-'}</td>
                      <td className="py-2.5 px-3 font-bold">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="py-2.5 px-3">R$ {it.unitPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        R$ {it.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totais do Orçamento */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 pt-4 border-t border-slate-100 text-xs">
              <div className="space-y-1 text-slate-600">
                <p>
                  Entrega prevista: <strong>{selectedQuote.expectedDeliveryDays} dias úteis</strong>
                </p>
                {selectedQuote.notes && (
                  <p>
                    Observações: <em>{selectedQuote.notes}</em>
                  </p>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-1 text-right mt-3 sm:mt-0">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>R$ {selectedQuote.subtotalAmount.toFixed(2)}</span>
                </div>
                {selectedQuote.discountPercent > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Desconto ({selectedQuote.discountPercent}%):</span>
                    <span className="text-red-600">- R$ {selectedQuote.discountAmount.toFixed(2)}</span>
                  </div>
                )}
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

      {/* MODAL: NOVO ORÇAMENTO (INSERÇÃO 100% MANUAL E DIRETA) */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-6 overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Calculator className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Novo Orçamento Direto</h2>
                  <p className="text-[11px] text-slate-300">
                    Digite os dados do cliente e os itens manualmente com cálculo automático de $m^2$
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowNewModal(false);
                  if (onCloseCreateModal) onCloseCreateModal();
                }}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
              )}

              {/* SEÇÃO 1: DADOS DO CLIENTE (MANUAL) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    1. Dados do Cliente & Local da Obra
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome do Cliente / Obra *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Carlos Andrade ou Residencial Vila Nova"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Vendedor / Responsável Comercial
                    </label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Ex: Seu Nome ou Vendas"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      WhatsApp / Telefone
                    </label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(maskPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      CPF ou CNPJ (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customerDocument}
                      onChange={(e) => setCustomerDocument(maskCpfCnpj(e.target.value))}
                      placeholder="000.000.000-00 ou 00.000.000/0001-00"
                      maxLength={18}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Endereço da Instalação / Local de Entrega
                    </label>
                    <input
                      type="text"
                      value={installationAddress}
                      onChange={(e) => setInstallationAddress(e.target.value)}
                      placeholder="Ex: Alameda dos Jacarandás, 340 - Apto 51 - Bairro Jardins"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO 2: INSERÇÃO MANUAL DE ITENS E MEDIDAS */}
              <div className="bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2. Inserir Peça / Vidro / Serviço Manualmente
                    </span>
                  </div>

                  {/* Alternar categoria */}
                  <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setItemCategory('VIDRO');
                        setItemUnit('M2');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        itemCategory === 'VIDRO'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Peça de Vidro (com Medidas)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemCategory('OUTRO');
                        setItemUnit('UN');
                        setPricingMode('TOTAL');
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        itemCategory === 'OUTRO'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Ferragem / Alumínio / Serviço
                    </button>
                  </div>
                </div>

                {/* Campo de Descrição Livre */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Descrição do Material / Serviço (digite livremente) *
                  </label>
                  <input
                    type="text"
                    required
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Ex: Vidro Temperado 8mm Incolor com lapidação e furação"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Se for VIDRO: Medidas em mm e cálculo de m² */}
                {itemCategory === 'VIDRO' ? (
                  <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">
                          Largura ($mm$)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={widthMm}
                          onChange={(e) => setWidthMm(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">
                          Altura ($mm$)
                        </label>
                        <input
                          type="number"
                          min="10"
                          value={heightMm}
                          onChange={(e) => setHeightMm(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">
                          Área Calculada ($m^2$)
                        </label>
                        <div className="px-2.5 py-1.5 bg-blue-100/60 border border-blue-200 rounded-lg font-black text-blue-900">
                          {currentAreaM2.toFixed(3)} m²
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-blue-900 mb-1">
                          Quantidade de Peças
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Preço por m² vs Preço Fixo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-100">
                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 mb-1">
                          Modo de Preço
                        </label>
                        <select
                          value={pricingMode}
                          onChange={(e) => setPricingMode(e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="M2">Preço por m² (Calcula Automático)</option>
                          <option value="TOTAL">Preço Fixo por Peça (R$)</option>
                        </select>
                      </div>

                      {pricingMode === 'M2' ? (
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Preço do $m^2$ (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={pricePerM2}
                            onChange={(e) => setPricePerM2(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[10px] font-bold text-blue-900 mb-1">
                            Preço Unitário da Peça (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="5"
                            value={manualPrice}
                            onChange={(e) => setManualPrice(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-blue-900 mb-1">
                          Acabamento / Furos (opcional)
                        </label>
                        <input
                          type="text"
                          value={finishingDetails}
                          onChange={(e) => setFinishingDetails(e.target.value)}
                          placeholder="Ex: Lapidação reta, 2 furos puxador"
                          className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Se for OUTRO / SERVIÇO */
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Unidade
                      </label>
                      <select
                        value={itemUnit}
                        onChange={(e) => setItemUnit(e.target.value as UnitOfMeasure)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                      >
                        <option value="UN">UN - Unidade</option>
                        <option value="CJ">CJ - Conjunto</option>
                        <option value="ML">ML - Metro Linear</option>
                        <option value="M2">M² - Metro Quadrado</option>
                        <option value="HR">HR - Hora Técnica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Preço Unitário (R$)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={manualPrice}
                        onChange={(e) => setManualPrice(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                  </div>
                )}

                {/* Subtotal da Linha e Botão de Adição */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-600">
                    Valor Unitário:{' '}
                    <strong className="text-slate-900">R$ {calculatedUnitPrice.toFixed(2)}</strong> | Total do
                    Item:{' '}
                    <strong className="text-blue-700 font-bold text-sm">
                      R$ {(quantity * calculatedUnitPrice).toFixed(2)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar este Item ao Orçamento</span>
                  </button>
                </div>
              </div>

              {/* LISTA DE ITENS INCLUSOS */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Itens Inclusos no Orçamento ({quoteItems.length})
                </span>

                {quoteItems.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhum item adicionado ainda. Configure acima e clique em "Adicionar este Item ao Orçamento".
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 font-bold text-slate-600 text-[10px] uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Item</th>
                          <th className="py-2.5 px-3">Descrição Técnica</th>
                          <th className="py-2.5 px-3">Medidas</th>
                          <th className="py-2.5 px-3">Qtd</th>
                          <th className="py-2.5 px-3">Unitário</th>
                          <th className="py-2.5 px-3">Total</th>
                          <th className="py-2.5 px-3 text-right">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {quoteItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-500">{it.code}</td>
                            <td className="py-2 px-3">
                              <p className="font-bold text-slate-900 uppercase text-xs">{it.description}</p>
                              {it.finishingDetails && (
                                <p className="text-[11px] text-slate-500 font-medium italic">
                                  {it.finishingDetails}
                                </p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {it.widthMm ? `${it.widthMm}x${it.heightMm}mm (${it.areaM2}m²)` : '-'}
                            </td>
                            <td className="py-2 px-3 font-bold text-slate-800">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-2 px-3 text-slate-700">R$ {it.unitPrice.toFixed(2)}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">
                              R$ {(it.quantity * it.unitPrice).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                title="Remover item"
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

              {/* SEÇÃO 3: CONDIÇÕES COMERCIAIS & OBSERVAÇÕES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Condição de Pagamento
                  </label>
                  <select
                    value={paymentConditionId}
                    onChange={(e) => setPaymentConditionId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
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
                    <label className="text-xs font-bold text-slate-700">Desconto Comercial (%)</label>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      Alçada: {currentUser.maxDiscountPercent}%
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
                      !discountPolicy.isValid ? 'border-red-500 text-red-600' : 'border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Frete / Instalação (R$)
                  </label>
                  <input
                    type="number"
                    value={freightAmount}
                    onChange={(e) => setFreightAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observações Específicas deste Orçamento (saem no PDF)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Incluso vedação com silicone e ferragens cromadas."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prazo de Entrega (dias úteis)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expectedDays}
                    onChange={(e) => setExpectedDays(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Totalizador Final e Botão de Emissão */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div>
                  <p className="text-xs text-slate-400">
                    Subtotal: R$ {modalSubtotal.toFixed(2)}
                    {discountPercent > 0 && ` | Desconto: -R$ ${discountVal.toFixed(2)}`}
                    {freightAmount > 0 && ` | Frete: +R$ ${freightAmount.toFixed(2)}`}
                  </p>
                  <p className="text-lg font-black text-white mt-0.5">
                    VALOR TOTAL: <span className="text-cyan-400">R$ {modalTotal.toFixed(2)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewModal(false);
                      if (onCloseCreateModal) onCloseCreateModal();
                    }}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs text-slate-300 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQuote}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    Emitir Orçamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR APROVAÇÃO INTERNA */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Registrar Aceite do Cliente</h3>
                <p className="text-xs text-slate-500">Aprovação comercial manual (via WhatsApp/Telefone)</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações do Contato / Aceite
              </label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Ex: Cliente aprovou via WhatsApp às 14:30. Solicitou entrega para próxima semana."
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmApproval}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 cursor-pointer"
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
            <p className="text-xs text-slate-500">
              Cria uma revisão (v{(selectedQuote?.currentVersion || 1) + 1}) mantendo o histórico da versão anterior intacto.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo da Revisão</label>
              <input
                type="text"
                value={newVersionNotes}
                onChange={(e) => setNewVersionNotes(e.target.value)}
                placeholder="Ex: Alteração de medidas e espessura do vidro"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewVersionModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewVersion}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer"
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
