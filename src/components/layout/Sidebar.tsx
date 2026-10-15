/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  ShoppingBag,
  Users,
  Package,
  Wrench,
  Building2,
  Database,
  Layers,
  ChevronRight,
  HardDrive,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';

export type ActiveTab =
  | 'quotes'
  | 'orders'
  | 'company'
  | 'database'
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'services';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { quotes, orders, companySettings } = useVidracaria();

  // Badges informativos em tempo real
  const openQuotesCount = quotes.filter(
    (q) => q.status === 'EM_NEGOCIACAO' || q.status === 'RASCUNHO'
  ).length;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'CONCLUIDO' && o.status !== 'CANCELADO'
  ).length;

  const mainItems = [
    {
      id: 'quotes' as ActiveTab,
      label: 'Orçamentos',
      icon: FileText,
      badge: openQuotesCount > 0 ? openQuotesCount : undefined,
      badgeColor: 'bg-blue-600',
      description: 'Emissão e cálculo de vidros',
    },
    {
      id: 'orders' as ActiveTab,
      label: 'Pedidos',
      icon: ShoppingBag,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-emerald-600',
      description: 'Pedidos aprovados e fechados',
    },
  ];

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-200 border-r border-slate-800 transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 h-18 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white truncate">
                Vidro<span className="text-cyan-400">Gestão</span>
              </span>
              <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {companySettings.tradingName || 'Gestão de Vidraçaria'}
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* Grupo 1: Gestão Operacional */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operação Comercial
            </div>
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white ${
                        item.badgeColor || 'bg-blue-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grupo 3: Configurações & Banco Local */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Configurações & Dados
            </div>
            <button
              onClick={() => {
                setActiveTab('company');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'company'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'company' ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span>Dados da Loja & PDF</span>
              </div>
            </button>

            <button
              onClick={() => {
                setActiveTab('database');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'database'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Database
                  className={`w-4 h-4 shrink-0 ${
                    activeTab === 'database' ? 'text-white' : 'text-cyan-400'
                  }`}
                />
                <span>Banco de Dados Local</span>
              </div>
            </button>
          </div>
        </div>

        {/* Rodapé: Indicador de Banco de Dados Local Ativo */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={() => {
              setActiveTab('database');
              setIsOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Banco Local Ativo
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white" />
            </div>
            <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>IndexedDB • Zero instalação</span>
            </p>
          </button>
        </div>
      </aside>
    </>
  );
};
