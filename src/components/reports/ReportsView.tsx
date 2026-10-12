import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileCheck,
  AlertTriangle,
  Boxes,
  PieChart,
  Calendar,
  Download,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';

export const ReportsView: React.FC = () => {
  const { quotes, orders, materialLosses, products, receivables, customers } = useVidracaria();
  const [period, setPeriod] = useState('MES_ATUAL');

  // Cálculos
  const totalFaturado = orders.reduce((acc, o) => acc + o.totalAmount, 0);
  const totalOrcado = quotes.reduce((acc, q) => acc + q.totalAmount, 0);
  const conversionRate = quotes.length > 0 ? (orders.length / quotes.length) * 100 : 0;

  // Quebras e Perdas
  const totalPerdasQtd = materialLosses.reduce((acc, l) => acc + l.quantity, 0);
  const perdasPorMotivo = materialLosses.reduce((acc: { [key: string]: number }, l) => {
    acc[l.reason] = (acc[l.reason] || 0) + l.quantity;
    return acc;
  }, {});

  // Vidros mais vendidos (área m²)
  const glassSales: { [code: string]: { name: string; qty: number; unit: string; totalVal: number } } = {};
  orders.forEach((ord) => {
    ord.items.forEach((it) => {
      if (!glassSales[it.code]) {
        glassSales[it.code] = { name: it.description, qty: 0, unit: it.unit, totalVal: 0 };
      }
      glassSales[it.code].qty += it.quantity;
      glassSales[it.code].totalVal += it.totalPrice;
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Relatórios & Inteligência Operacional</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Análise de conversão comercial, índice de perdas por corte/quebra e faturamento
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium"
          >
            <option value="MES_ATUAL">Mês Atual (Fevereiro 2026)</option>
            <option value="TRIMESTRE">Últimos 90 dias</option>
            <option value="ANO">Ano Vigente (2026)</option>
          </select>
        </div>
      </div>

      {/* Grid de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase">Receita Faturada</span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            R$ {totalFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
            {orders.length} pedidos fechados
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase">Total Orçado em Propostas</span>
          <p className="text-2xl font-black text-slate-900 mt-2">
            R$ {totalOrcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <span className="text-[11px] text-blue-600 font-semibold block mt-1">
            {quotes.length} orçamentos emitidos
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase">Taxa de Conversão</span>
          <p className="text-2xl font-black text-blue-700 mt-2">
            {conversionRate.toFixed(1)}%
          </p>
          <span className="text-[11px] text-slate-700 block mt-1">Média do setor: ~35%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-700 uppercase">Índice de Perda Industrial</span>
          <p className="text-2xl font-black text-red-600 mt-2">
            {totalPerdasQtd.toFixed(1)} un/m²
          </p>
          <span className="text-[11px] text-slate-700 block mt-1">Quebras, avarias e erros de corte</span>
        </div>
      </div>

      {/* Detalhamento de Perdas por Causa Raiz */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>Causa Raiz de Perdas de Vidro & Perfis</span>
            </h2>
            <span className="text-xs font-bold text-red-600">{materialLosses.length} ocorrências</span>
          </div>

          <div className="space-y-3 mt-4">
            {Object.entries(perdasPorMotivo).map(([motivo, qtd]) => {
              const perc = totalPerdasQtd > 0 ? (qtd / totalPerdasQtd) * 100 : 0;
              return (
                <div key={motivo}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{motivo}</span>
                    <span className="text-slate-600 font-semibold">{qtd} peças/m² ({perc.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${perc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Vidros & Itens Mais Vendidos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-500" />
              <span>Materiais com Maior Saída em Pedidos</span>
            </h2>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {Object.entries(glassSales).map(([code, item]) => (
              <div key={code} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-700">Código: {code}</p>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 block">
                    {item.qty} {item.unit}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    R$ {item.totalVal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
