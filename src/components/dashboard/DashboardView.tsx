/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  FileCheck,
  Calculator,
  ShoppingBag,
  Users,
  Package,
  Wrench,
  Database,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Building2,
  HardDrive,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { ActiveTab } from '../layout/Sidebar';
import { Quote, Order } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewQuote: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewQuote,
}) => {
  const {
    quotes,
    orders,
    products,
    services,
    customers,
    companySettings,
  } = useVidracaria();

  // Métricas Comerciais e Operacionais
  const approvedQuotes = quotes.filter((q) => q.status === 'APROVADO');
  const openQuotes = quotes.filter(
    (q) => q.status === 'EM_NEGOCIACAO' || q.status === 'RASCUNHO'
  );
  const conversionRate = quotes.length > 0 ? (approvedQuotes.length / quotes.length) * 100 : 0;

  const totalVendas = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const ticketMedio = orders.length > 0 ? totalVendas / orders.length : 0;
  const totalEmNegociacao = openQuotes.reduce((acc, q) => acc + q.totalAmount, 0);

  const activeCustomers = customers.filter((c) => !c.deletedAt);
  const activeProducts = products.filter((p) => !p.deletedAt);
  const activeServices = services.filter((s) => !s.deletedAt);

  // Status visual para Orçamentos
  const getQuoteStatusBadge = (status: Quote['status']) => {
    switch (status) {
      case 'APROVADO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Aprovado
          </span>
        );
      case 'EM_NEGOCIACAO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Em Negociação
          </span>
        );
      case 'CANCELADO':
      case 'RECUSADO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
            Recusado
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Status visual para Pedidos
  const getOrderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'AGUARDANDO_PRODUCAO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
            Aguardando Produção
          </span>
        );
      case 'EM_PRODUCAO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
            Em Produção
          </span>
        );
      case 'PRONTO':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">
            Pronto / Expedição
          </span>
        );
      case 'CONCLUIDO':
      case 'ENTREGUE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            Concluído
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas Enxuto */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operação Local Ativa
              </span>
              <span className="text-xs text-slate-300">
                {companySettings.tradingName || companySettings.name}
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-2 text-white">
              Painel Operacional & Vendas
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Cotações técnicas por m², pedidos de venda e cadastros com banco de dados local integrado e sem necessidade de configurações de servidor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenNewQuote}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Novo Orçamento</span>
            </button>
            <button
              onClick={() => onNavigate('orders')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Ver Pedidos</span>
            </button>
            <button
              onClick={() => onNavigate('database')}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              title="Ver detalhes do banco de dados local"
            >
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Banco Local</span>
            </button>
          </div>
        </div>

        {/* Efeito visual decorativo */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid de KPIs Principais de Vendas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Concretizadas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total em Vendas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            R$ {totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-bold text-emerald-600">{orders.length} pedidos</span>
            <span>• Ticket médio: R$ {ticketMedio.toFixed(2)}</span>
          </div>
        </div>

        {/* Em Negociação */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Propostas em Aberto
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            R$ {totalEmNegociacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-bold text-blue-600">{openQuotes.length} orçamentos</span>
            <span>aguardando fechamento</span>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {conversionRate.toFixed(1)}%
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-bold text-indigo-600">{approvedQuotes.length} aprovados</span>
            <span>de {quotes.length} emitidos</span>
          </div>
        </div>

        {/* Cadastros Ativos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Base de Cadastros
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {activeCustomers.length} Clientes
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600">
            <span className="font-bold text-cyan-700">{activeProducts.length} vidros/itens</span>
            <span>• {activeServices.length} serviços</span>
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos de Operação */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigate('customers')}
          className="p-3.5 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-blue-600">
              Cadastrar Cliente
            </span>
            <span className="text-[10px] text-slate-500">PF e PJ com endereço</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('products')}
          className="p-3.5 bg-white hover:bg-cyan-50/50 border border-slate-200 hover:border-cyan-300 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-cyan-600">
              Produtos & Vidros
            </span>
            <span className="text-[10px] text-slate-500">Temperados, perfis e ferragens</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('services')}
          className="p-3.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-amber-600">
              Serviços & Mão de Obra
            </span>
            <span className="text-[10px] text-slate-500">Instalação, medição e frete</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('company')}
          className="p-3.5 bg-white hover:bg-purple-50/50 border border-slate-200 hover:border-purple-300 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block truncate group-hover:text-purple-600">
              Dados da Loja no PDF
            </span>
            <span className="text-[10px] text-slate-500">CNPJ, telefones e cabeçalho</span>
          </div>
        </button>
      </div>

      {/* Blocos Centrais: Orçamentos Recentes & Pedidos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orçamentos Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Últimos Orçamentos</span>
              </h2>
              <p className="text-xs text-slate-500">Cotações técnicas recentes</p>
            </div>
            <button
              onClick={() => onNavigate('quotes')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {quotes.slice(0, 5).map((q) => {
              const cust = customers.find((c) => c.id === q.customerId);
              return (
                <div
                  key={q.id}
                  onClick={() => onNavigate('quotes')}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {q.quoteNumber}
                      </span>
                      {getQuoteStatusBadge(q.status)}
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                      {cust?.name || 'Cliente'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      R$ {q.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}

            {quotes.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum orçamento cadastrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* Pedidos Fechados Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Pedidos de Venda Recentes</span>
              </h2>
              <p className="text-xs text-slate-500">Vendas confirmadas</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Todos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {orders.slice(0, 5).map((o) => {
              const cust = customers.find((c) => c.id === o.customerId);
              return (
                <div
                  key={o.id}
                  onClick={() => onNavigate('orders')}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/60 rounded-lg px-2 transition-colors cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {o.orderNumber}
                      </span>
                      {getOrderStatusBadge(o.status)}
                    </div>
                    <p className="text-xs text-slate-600 truncate max-w-[200px] sm:max-w-xs">
                      {cust?.name || 'Cliente'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-900 block">
                      R$ {o.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              );
            })}

            {orders.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhum pedido de venda registrado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
