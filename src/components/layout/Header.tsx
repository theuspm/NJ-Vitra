/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  Building2,
  Database,
  FileText,
  ShoppingBag,
  Users,
  Package,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenNewQuote: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNavigate,
  onOpenNewQuote,
}) => {
  const { searchGlobal, companySettings } = useVidracaria();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery ? searchGlobal(searchQuery) : null;

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-xs">
      {/* Botão Mobile e Busca Global */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 rounded-lg hover:bg-slate-100 md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Campo de Busca Rápida */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Buscar orçamento por número, cliente ou pedido..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Resultados da Busca Global */}
          {showSearchResults && searchResults && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-200 py-2 max-h-96 overflow-y-auto z-50 divide-y divide-slate-100">
              {/* Orçamentos */}
              {searchResults.quotes.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase">
                    <FileText className="w-3 h-3 text-indigo-600" />
                    <span>Orçamentos</span>
                  </div>
                  {searchResults.quotes.slice(0, 5).map((q) => (
                    <div
                      key={q.id}
                      onClick={() => {
                        onNavigate('quotes');
                        setShowSearchResults(false);
                      }}
                      className="px-2 py-1.5 hover:bg-blue-50 rounded-lg cursor-pointer text-xs"
                    >
                      <p className="font-semibold text-slate-800">{q.quoteNumber}</p>
                      <p className="text-slate-500 text-[11px]">
                        R$ {q.totalAmount.toFixed(2)} • {q.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Pedidos */}
              {searchResults.orders.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center gap-1.5 px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase">
                    <ShoppingBag className="w-3 h-3 text-emerald-600" />
                    <span>Pedidos</span>
                  </div>
                  {searchResults.orders.slice(0, 5).map((o) => (
                    <div
                      key={o.id}
                      onClick={() => {
                        onNavigate('orders');
                        setShowSearchResults(false);
                      }}
                      className="px-2 py-1.5 hover:bg-blue-50 rounded-lg cursor-pointer text-xs"
                    >
                      <p className="font-semibold text-slate-800">{o.orderNumber}</p>
                      <p className="text-slate-500 text-[11px]">
                        R$ {o.totalAmount.toFixed(2)} • {o.status}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.quotes.length === 0 && searchResults.orders.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  Nenhum orçamento ou pedido encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ações da Direita */}
      <div className="flex items-center gap-2.5">
        {/* Status Banco Local */}
        <button
          onClick={() => onNavigate('database')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
          title="Banco de dados local do navegador (IndexedDB) ativo e sincronizado"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Banco Local Ativo</span>
        </button>

        {/* Dados da Loja */}
        <button
          onClick={() => onNavigate('company')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors cursor-pointer"
          title="Configurações da loja e cabeçalho do PDF"
        >
          <Building2 className="w-3.5 h-3.5 text-slate-600" />
          <span className="truncate max-w-[120px]">
            {companySettings.name.split(' ')[0]}
          </span>
        </button>

        {/* Botão Novo Orçamento Principal */}
        <button
          onClick={onOpenNewQuote}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Orçamento</span>
          <span className="sm:hidden">Orçamento</span>
        </button>
      </div>
    </header>
  );
};
