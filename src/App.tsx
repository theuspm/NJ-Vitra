/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VidracariaProvider } from './context/VidracariaContext';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { QuotesView } from './components/quotes/QuotesView';
import { OrdersView } from './components/orders/OrdersView';
import { CompanySettingsView } from './components/company/CompanySettingsView';
import { DatabaseView } from './components/database/DatabaseView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/customers/CustomersView';
import { ProductsView } from './components/products/ProductsView';
import { ServicesView } from './components/services/ServicesView';
import { ProductionView } from './components/production/ProductionView';
import { StockView } from './components/stock/StockView';
import { FinancialView } from './components/financial/FinancialView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersView } from './components/users/UsersView';
import { AuditView } from './components/audit/AuditView';

const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('quotes');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewQuoteOpen, setIsNewQuoteOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenNewQuote = () => {
    setActiveTab('quotes');
    setIsNewQuoteOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenNewQuote={handleOpenNewQuote}
          />
        );
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
      case 'customers':
        return <CustomersView />;
      case 'products':
        return <ProductsView />;
      case 'services':
        return <ServicesView />;
      case 'production':
        return <ProductionView />;
      case 'stock':
        return <StockView />;
      case 'financial':
        return <FinancialView />;
      case 'suppliers':
        return <SuppliersView />;
      case 'reports':
        return <ReportsView />;
      case 'users':
        return <UsersView />;
      case 'audit':
        return <AuditView />;
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
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

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
