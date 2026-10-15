/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { VidracariaProvider } from './context/VidracariaContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { QuotesView } from './components/quotes/QuotesView';
import { OrdersView } from './components/orders/OrdersView';
import { CompanySettingsView } from './components/company/CompanySettingsView';
import { DatabaseView } from './components/database/DatabaseView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quotes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);

  const handleOpenNewQuote = () => {
    setActiveTab('quotes');
    setIsNewQuoteOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'quotes':
        return (
          <QuotesView
            isCreateModalOpen={isNewQuoteOpen}
            onCloseCreateModal={() => setIsNewQuoteOpen(false)}
            onNavigateToCompany={() => setActiveTab('company')}
          />
        );
      case 'orders':
        return <OrdersView />;
      case 'company':
        return <CompanySettingsView />;
      case 'database':
        return <DatabaseView />;
      default:
        return (
          <QuotesView
            isCreateModalOpen={isNewQuoteOpen}
            onCloseCreateModal={() => setIsNewQuoteOpen(false)}
            onNavigateToCompany={() => setActiveTab('company')}
          />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-100/70 text-slate-800 antialiased overflow-hidden font-sans">
      {/* Sidebar Enxuta */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNavigate={(tab) => setActiveTab(tab)}
          onOpenNewQuote={handleOpenNewQuote}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <VidracariaProvider>
        <MainLayout />
      </VidracariaProvider>
    </AuthProvider>
  );
}
