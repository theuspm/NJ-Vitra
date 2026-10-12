import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Truck,
  Factory,
  CheckCheck,
  XCircle,
  Calendar,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ShoppingBag,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Order, OrderStatus } from '../../types';

export const OrdersView: React.FC = () => {
  const { orders, customers, quotes, updateOrderStatus, productionOrders } = useVidracaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const cust = customers.find((c) => c.id === o.customerId);
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'TODOS' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'AGUARDANDO_PRODUCAO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Aguardando Produção</span>;
      case 'EM_PRODUCAO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Em Produção</span>;
      case 'PRONTO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Pronto / Expedição</span>;
      case 'EM_INSTALACAO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Em Instalação</span>;
      case 'ENTREGUE':
      case 'CONCLUIDO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Concluído</span>;
      case 'CANCELADO':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Carteira de Pedidos de Venda</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Pedidos convertidos a partir de orçamentos aprovados com congelamento de preços e reserva de estoque
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por número do pedido (#PED-2026-...) ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
        >
          <option value="TODOS">Todos os Status</option>
          <option value="AGUARDANDO_PRODUCAO">Aguardando Produção</option>
          <option value="EM_PRODUCAO">Em Produção</option>
          <option value="PRONTO">Pronto</option>
          <option value="EM_INSTALACAO">Em Instalação</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
      </div>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.map((order) => {
          const cust = customers.find((c) => c.id === order.customerId);
          const quote = quotes.find((q) => q.id === order.quoteId);
          const prodOrder = productionOrders.find((p) => p.orderId === order.id);

          return (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-700">
                    {order.orderNumber}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="mt-3">
                  <p className="text-xs font-bold text-slate-900">{cust?.name}</p>
                  <p className="text-[11px] text-slate-700 mt-0.5">
                    Origem: <strong className="text-slate-800">{quote?.quoteNumber || 'Orçamento Aprovado'}</strong> (v{order.approvedQuoteVer})
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Data do Pedido:</span>
                    <span className="font-semibold text-slate-800">
                      {new Date(order.orderDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Previsão de Entrega:</span>
                    <span className="font-semibold text-slate-800">
                      {order.promisedDeliveryDate ? new Date(order.promisedDeliveryDate).toLocaleDateString('pt-BR') : 'A definir'}
                    </span>
                  </div>
                  {prodOrder && (
                    <div className="flex items-center justify-between text-blue-700 font-semibold">
                      <span>Etapa de Fábrica:</span>
                      <span className="px-1.5 py-0.5 bg-blue-50 rounded text-[10px]">
                        {prodOrder.currentStage}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-700 block">Total Aprovado:</span>
                  <span className="text-sm font-black text-slate-900">
                    R$ {order.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <span>Detalhes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredOrders.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Nenhum pedido de venda registrado
          </h3>
          <p className="text-xs text-slate-500 mb-2 leading-relaxed">
            Os pedidos são gerados automaticamente quando um orçamento é aprovado pelo cliente.
          </p>
          <p className="text-[11px] text-slate-400">
            Crie um orçamento e converta em pedido quando a venda for fechada.
          </p>
        </div>
      )}

      {/* Modal de Detalhes do Pedido com Snapshot Imutável */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900">{selectedOrder.orderNumber}</h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-xs text-slate-700 mt-0.5">
                  Cliente: {customers.find((c) => c.id === selectedOrder.customerId)?.name} • Instalação: {selectedOrder.installationAddress || 'Balcão'}
                </p>
              </div>

              {/* Seletor de Transição de Status */}
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus);
                  setSelectedOrder({ ...selectedOrder, status: e.target.value as OrderStatus });
                }}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 border border-slate-300 rounded-xl"
              >
                <option value="AGUARDANDO_PRODUCAO">Aguardando Produção</option>
                <option value="EM_PRODUCAO">Em Produção</option>
                <option value="PRONTO">Pronto / Expedição</option>
                <option value="EM_INSTALACAO">Em Instalação</option>
                <option value="CONCLUIDO">Concluído</option>
                <option value="CANCELADO">Cancelar Pedido</option>
              </select>
            </div>

            {/* Aviso de Snapshot */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Snapshot Comercial Congelado:</strong> Os valores unitários e as especificações técnicas foram preservados exatamente conforme aprovados no Orçamento #{quotes.find((q) => q.id === selectedOrder.quoteId)?.quoteNumber}, protegidos contra flutuações futuras do catálogo.
              </span>
            </div>

            {/* Itens do Pedido */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Itens e Materiais do Pedido
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3">Medidas</th>
                      <th className="py-2.5 px-3">Qtd</th>
                      <th className="py-2.5 px-3">Unitário</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it) => (
                      <tr key={it.id}>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{it.description}</p>
                          {it.finishingDetails && (
                            <p className="text-[10px] text-slate-700">{it.finishingDetails}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {it.widthMm ? `${it.widthMm}x${it.heightMm}mm (${it.areaM2}m²)` : '-'}
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
            </div>

            {/* Totais */}
            <div className="flex justify-end pt-3 border-t border-slate-100 text-xs">
              <div className="w-64 space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>R$ {selectedOrder.subtotalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Desconto Aplicado:</span>
                  <span className="text-red-600">- R$ {selectedOrder.discountAmount.toFixed(2)}</span>
                </div>
                {selectedOrder.freightAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Frete / Montagem:</span>
                    <span>+ R$ {selectedOrder.freightAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                  <span>TOTAL DO PEDIDO:</span>
                  <span>R$ {selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
