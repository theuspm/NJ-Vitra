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
  HardDrive,
  Crown,
  Zap,
  LogOut,
  Factory,
  Boxes,
  DollarSign,
  Truck,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { useAuth } from '../../context/AuthContext';

export type ActiveTab =
  | 'quotes'
  | 'orders'
  | 'company'
  | 'database'
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'services'
  | 'production'
  | 'stock'
  | 'financial'
  | 'suppliers'
  | 'reports'
  | 'users'
  | 'audit';

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
  const { currentUser, currentPlan, logout } = useAuth();

  const isPremium = currentPlan === 'PREMIUM';

  // Badges informativos em tempo real
  const openQuotesCount = quotes.filter(
    (q) => q.status === 'EM_NEGOCIACAO' || q.status === 'RASCUNHO'
  ).length;
  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'CONCLUIDO' && o.status !== 'CANCELADO'
  ).length;

  const basicItems = [
    {
      id: 'quotes' as ActiveTab,
      label: 'Orçamentos',
      icon: FileText,
      badge: openQuotesCount > 0 ? openQuotesCount : undefined,
      badgeColor: 'bg-blue-600',
    },
    {
      id: 'orders' as ActiveTab,
      label: 'Pedidos',
      icon: ShoppingBag,
      badge: activeOrdersCount > 0 ? activeOrdersCount : undefined,
      badgeColor: 'bg-emerald-600',
    },
  ];

  const premiumAnalyticsItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Geral',
      icon: LayoutDashboard,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Relatórios & BI',
      icon: BarChart3,
    },
  ];

  const premiumCatalogAndOpsItems = [
    {
      id: 'customers' as ActiveTab,
      label: 'Clientes (CRM)',
      icon: Users,
    },
    {
      id: 'products' as ActiveTab,
      label: 'Produtos & Vidros',
      icon: Package,
    },
    {
      id: 'services' as ActiveTab,
      label: 'Serviços & Mão de Obra',
      icon: Wrench,
    },
    {
      id: 'production' as ActiveTab,
      label: 'Produção & Medição',
      icon: Factory,
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Estoque & Perdas',
      icon: Boxes,
    },
    {
      id: 'suppliers' as ActiveTab,
      label: 'Fornecedores',
      icon: Truck,
    },
  ];

  const premiumFinancialAndAdminItems = [
    {
      id: 'financial' as ActiveTab,
      label: 'Financeiro / Contas',
      icon: DollarSign,
    },
    {
      id: 'users' as ActiveTab,
      label: 'Equipe & Alçadas',
      icon: UserCheck,
    },
    {
      id: 'audit' as ActiveTab,
      label: 'Auditoria de Ações',
      icon: ShieldAlert,
    },
  ];

  const renderMenuButton = (item: {
    id: ActiveTab;
    label: string;
    icon: any;
    badge?: number;
    badgeColor?: string;
  }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => {
          setActiveTab(item.id);
          setIsOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
          isActive
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
            : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
          <span className="truncate">{item.label}</span>
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
  };

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
        {/* Brand & Plano Ativo */}
        <div className="flex items-center gap-3 px-4 h-18 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-base tracking-tight text-white truncate">
                Vidro<span className="text-cyan-400">Gestão</span>
              </span>
              {isPremium ? (
                <span className="text-[9px] font-black tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5 shrink-0">
                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                  PREMIUM
                </span>
              ) : (
                <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  BÁSICO
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {companySettings.tradingName || companySettings.name || currentUser.storeName || 'Minha Vidraçaria'}
            </p>
          </div>
        </div>

        {/* Menu Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {/* Se for PREMIUM: Indicadores e Dashboard */}
          {isPremium && (
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-1">
                <Crown className="w-3 h-3" />
                <span>Indicadores & Gestão</span>
              </div>
              {premiumAnalyticsItems.map(renderMenuButton)}
            </div>
          )}

          {/* Operação Comercial (Presente no Básico e no Premium) */}
          <div className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operação Comercial
            </div>
            {basicItems.map(renderMenuButton)}
          </div>

          {/* Se for PREMIUM: Catálogo, Produção e Estoque */}
          {isPremium ? (
            <>
              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Catálogo, Fábrica & Estoque
                </div>
                {premiumCatalogAndOpsItems.map(renderMenuButton)}
              </div>

              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                  Financeiro & Equipe
                </div>
                {premiumFinancialAndAdminItems.map(renderMenuButton)}
              </div>
            </>
          ) : (
            /* No Plano BÁSICO: Informativo discreto de recursos exclusivos do Pacote Premium */
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  Pacote Premium
                </span>
                <Lock className="w-3 h-3 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Dashboard, Catálogo de Vidros, Clientes, Estoque, Produção e Financeiro disponíveis mediante upgrade com o administrador.
              </p>
            </div>
          )}

          {/* Configurações & Banco */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Configurações da Loja
            </div>
            <button
              onClick={() => {
                setActiveTab('company');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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
                <span>Base de Dados & Nuvem</span>
              </div>
            </button>
          </div>
        </div>

        {/* Rodapé: Conta do Lojista e Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800">
            {isPremium ? (
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            )}
            <div className="text-left truncate">
              <p className="text-[11px] font-bold text-white leading-tight">
                {isPremium ? 'Licença Pacote Premium' : 'Licença Pacote Básico'}
              </p>
            </div>
          </div>

          {/* Usuário Logado & Botão Sair */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="min-w-0 pr-2">
              <p className="text-[11px] font-bold text-slate-200 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <HardDrive className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                <span>{currentUser.email}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sair da conta"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
