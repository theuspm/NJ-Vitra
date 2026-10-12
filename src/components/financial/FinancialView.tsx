import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Receipt,
  UserCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Receivable, ReceivableStatus } from '../../types';

export const FinancialView: React.FC = () => {
  const { receivables, customers, registerPayment, orders } = useVidracaria();
  const [activeTab, setActiveTab] = useState<'RECEBER' | 'COMISSOES'>('RECEBER');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');

  // Modal Baixa
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('PIX');
  const [payNotes, setPayNotes] = useState<string>('');

  const filteredReceivables = receivables.filter((r) => {
    const matchesSearch =
      r.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPendente = receivables
    .filter((r) => r.status === 'PENDENTE' || r.status === 'PARCIAL')
    .reduce((acc, r) => acc + r.balanceDue, 0);

  const totalRecebido = receivables
    .flatMap((r) => r.payments)
    .reduce((acc, p) => acc + p.amountPaid, 0);

  const totalAtrasado = receivables
    .filter((r) => r.status === 'ATRASADO')
    .reduce((acc, r) => acc + r.balanceDue, 0);

  const handleOpenPayment = (rec: Receivable) => {
    setSelectedReceivable(rec);
    setPayAmount(rec.balanceDue);
  };

  const handleConfirmPayment = () => {
    if (!selectedReceivable) return;
    if (payAmount <= 0) {
      alert('Informe um valor de pagamento maior que zero.');
      return;
    }
    registerPayment(selectedReceivable.id, payMethod, payAmount, payNotes);
    setSelectedReceivable(null);
    setPayNotes('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestão Financeira & Faturamento</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Controle de parcelas a receber, baixas parciais/totais e comissões comerciais de vidraçaria
          </p>
        </div>
      </div>

      {/* Cards de Métricas Financeiras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Saldo a Receber</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            R$ {totalPendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-slate-600 mt-1 block">Títulos em aberto e parciais</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Total Liquidado</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            R$ {totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-700 mt-1 block">Entradas confirmadas em caixa</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase">Títulos Vencidos</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 mt-2">
            R$ {totalAtrasado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-red-600 mt-1 block">Ações de cobrança recomendadas</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('RECEBER')}
          className={`pb-3 px-3 transition-colors ${
            activeTab === 'RECEBER'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Contas a Receber ({receivables.length} títulos)
        </button>
        <button
          onClick={() => setActiveTab('COMISSOES')}
          className={`pb-3 px-3 transition-colors ${
            activeTab === 'COMISSOES'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Comissões de Vendedores
        </button>
      </div>

      {activeTab === 'RECEBER' ? (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por pedido ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="PENDENTE">Pendente</option>
              <option value="PARCIAL">Pago Parcial</option>
              <option value="PAGO">Liquidado / Pago</option>
              <option value="ATRASADO">Atrasado</option>
            </select>
          </div>

          {/* Tabela de Recebíveis */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Pedido / Parcela</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Valor Original</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-right">Saldo Devedor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReceivables.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-blue-700">{rec.orderNumber}</p>
                      <p className="text-[10px] text-slate-700">Parcela {rec.installmentNum}/{rec.totalInstallments}</p>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{rec.customerName}</td>
                    <td className="py-3 px-4 text-slate-700">
                      {new Date(rec.dueDate).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      R$ {rec.originalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      R$ {rec.paidAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      R$ {rec.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          rec.status === 'PAGO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.status === 'PARCIAL'
                            ? 'bg-blue-100 text-blue-800'
                            : rec.status === 'ATRASADO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {rec.status !== 'PAGO' && (
                        <button
                          onClick={() => handleOpenPayment(rec)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Dar Baixa
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Comissões de Venda */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Demonstrativo de Comissões por Vendedor</h3>
            <p className="text-xs text-slate-600">
              Cálculo baseado no percentual comissionado das ordens faturadas
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  LV
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Lucas Vendedor</p>
                  <p className="text-[11px] text-slate-600">Alçada: 5% comissão sobre vendas líquidas</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 block">Total a Liberar:</span>
                <span className="text-sm font-black text-emerald-600">R$ 214,80</span>
              </div>
            </div>

            <div className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  MG
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Mariana Gerente</p>
                  <p className="text-[11px] text-slate-600">Bônus gerencial de equipe</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 block">Total a Liberar:</span>
                <span className="text-sm font-black text-emerald-600">R$ 142,00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE BAIXA DE PAGAMENTO */}
      {selectedReceivable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Baixa de Pagamento - {selectedReceivable.orderNumber}</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p>Cliente: <strong>{selectedReceivable.customerName}</strong></p>
              <p>Saldo Devedor Atual: <strong>R$ {selectedReceivable.balanceDue.toFixed(2)}</strong></p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Forma de Pagamento</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="PIX">PIX (Instantâneo)</option>
                  <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                  <option value="CARTAO_DEBITO">Cartão de Débito</option>
                  <option value="DINHEIRO">Dinheiro / Espécie</option>
                  <option value="BOLETO">Boleto Bancário</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valor Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedReceivable.balanceDue}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-black text-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Comprovante</label>
              <input
                type="text"
                placeholder="Ex: Comprovante de transferência bancária nº 883921"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReceivable(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                Confirmar Liquidação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
