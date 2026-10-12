/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  Database,
  HardDrive,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  FileText,
  ShoppingBag,
  Users,
  Wrench,
  Package,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { LocalDatabaseService } from '../../services/LocalDatabaseService';

export const DatabaseView: React.FC = () => {
  const {
    customers,
    products,
    services,
    quotes,
    orders,
    companySettings,
    clearDatabaseToZero,
    resetToSeedData,
  } = useVidracaria();

  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      await LocalDatabaseService.exportFullBackup(
        customers,
        products,
        services,
        quotes,
        orders,
        companySettings
      );
      setImportStatus('Backup JSON exportado com sucesso para a pasta de Downloads!');
      setTimeout(() => setImportStatus(null), 5000);
    } catch (err: any) {
      alert('Erro ao exportar backup: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Validando e carregando arquivo de backup...');
      const dump = await LocalDatabaseService.parseBackupFile(file);

      // Persiste no LocalStorage e IndexedDB
      localStorage.setItem('vidrogestao_customers', JSON.stringify(dump.customers));
      localStorage.setItem('vidrogestao_products', JSON.stringify(dump.products));
      if (dump.services) localStorage.setItem('vidrogestao_services', JSON.stringify(dump.services));
      localStorage.setItem('vidrogestao_quotes', JSON.stringify(dump.quotes));
      localStorage.setItem('vidrogestao_orders', JSON.stringify(dump.orders));
      if (dump.companySettings) {
        localStorage.setItem('vidrogestao_company_settings', JSON.stringify(dump.companySettings));
      }

      await Promise.all([
        LocalDatabaseService.saveCollection('customers', dump.customers),
        LocalDatabaseService.saveCollection('products', dump.products),
        LocalDatabaseService.saveCollection('services', dump.services || []),
        LocalDatabaseService.saveCollection('quotes', dump.quotes),
        LocalDatabaseService.saveCollection('orders', dump.orders),
      ]);

      setImportStatus('Backup restaurado com sucesso! Recarregando sistema...');
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      alert('Falha ao restaurar backup: ' + err.message);
      setImportStatus(null);
    }
  };

  const handleConfirmClearZero = async () => {
    try {
      await clearDatabaseToZero();
      setShowClearConfirm(false);
      setImportStatus('Banco de dados completamente zerado! Todas as listas estão limpas para você começar do zero.');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      alert('Erro ao zerar banco: ' + err.message);
    }
  };

  const handleConfirmReset = () => {
    resetToSeedData();
    setShowResetConfirm(false);
    setImportStatus('Banco de dados restaurado com dados padrão com sucesso!');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const totalRecords =
    customers.length + products.length + services.length + quotes.length + orders.length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {totalRecords === 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Banco Limpo (0 registros) • Pronto para Uso do Zero
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Banco de Dados Local Ativo ({totalRecords} registros)
              </span>
            )}
            <span className="text-xs text-slate-500">Tecnologia: IndexedDB Browser Native</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Armazenamento & Banco de Dados Local
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Todos os seus cadastros, orçamentos e pedidos estão salvos com segurança diretamente no
            navegador deste dispositivo. Sem necessidade de servidores terceirizados, sem dependência de internet para salvar e com total privacidade dos seus dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportBackup}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exportando...' : 'Exportar Backup (.JSON)'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {importStatus && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Cards de Métricas do Banco */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Clientes
            </span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{customers.length}</p>
          <span className="text-[10px] text-slate-500">registros salvos</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Produtos & Vidros
            </span>
            <Package className="w-4 h-4 text-cyan-600" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{products.length}</p>
          <span className="text-[10px] text-slate-500">vidros e perfis</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Serviços
            </span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{services.length}</p>
          <span className="text-[10px] text-slate-500">mão de obra</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Orçamentos
            </span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{quotes.length}</p>
          <span className="text-[10px] text-slate-500">propostas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Pedidos
            </span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-800 mt-2">{orders.length}</p>
          <span className="text-[10px] text-slate-500">vendas fechadas</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
              Total Geral
            </span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-white mt-2">{totalRecords}</p>
          <span className="text-[10px] text-slate-400">itens sincronizados</span>
        </div>
      </div>

      {/* Painel Central de Gestão do Banco */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Como Funciona a Persistência */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Arquitetura de Banco de Dados Local
              </h2>
              <p className="text-xs text-slate-500">Zero instalação, alta segurança e desempenho</p>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Persistência Permanente no Navegador</strong>
                Os dados são gravados no <strong>IndexedDB</strong> deste navegador. Você pode fechar a aba, reiniciar o computador ou usar offline: seus dados continuam aqui intactos.
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Sem Servidor ou Banco Terceiro</strong>
                Não há necessidade de instalar PostgreSQL, MySQL ou Docker. O motor de dados roda no próprio runtime web de forma autônoma.
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block">Backup & Portabilidade em 1 Clique</strong>
                Você pode baixar seu arquivo <code>.json</code> e transferir tudo para outro computador ou guardar como cópia de segurança periódica.
              </div>
            </div>
          </div>
        </div>

        {/* Ações de Backup e Restauração */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Operações de Segurança & Cópia
              </h2>
              <p className="text-xs text-slate-500">Exporte, restaure ou reinicie os dados</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Exportar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Exportar Backup Completo
                </span>
                <span className="text-[11px] text-slate-500">
                  Gera arquivo JSON com todos os cadastros, orçamentos e pedidos.
                </span>
              </div>
              <button
                onClick={handleExportBackup}
                disabled={isExporting}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
              >
                Baixar JSON
              </button>
            </div>

            {/* Importar */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Restaurar Backup do Arquivo
                </span>
                <span className="text-[11px] text-slate-500">
                  Carrega um arquivo JSON de backup exportado anteriormente.
                </span>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0"
                >
                  Subir JSON
                </button>
              </div>
            </div>

            {/* Zerar Banco de Dados do Zero */}
            <div className="flex items-center justify-between p-3.5 bg-red-50/70 rounded-xl border border-red-300">
              <div>
                <span className="text-xs font-bold text-red-900 block flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-red-600" />
                  Zerar Banco de Dados (Limpar Tudo do Zero)
                </span>
                <span className="text-[11px] text-red-700">
                  Apaga todos os clientes, produtos, serviços, orçamentos e pedidos para você começar do zero.
                </span>
              </div>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 shadow-sm active:scale-95 transition-all"
              >
                Zerar do Zero
              </button>
            </div>

            {/* Restaurar Padrão de Demonstração */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Carregar Dados de Exemplo (Demonstração)
                </span>
                <span className="text-[11px] text-slate-500">
                  Opcional: preenche o sistema com exemplos de vidros, clientes e orçamentos para testes.
                </span>
              </div>
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold cursor-pointer shrink-0"
              >
                Carregar Amostras
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação: Zerar Banco do Zero */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Zerar Todo o Banco de Dados?
              </h3>
              <p className="text-xs text-slate-600">
                Tem certeza que deseja apagar todos os registros do banco local (IndexedDB e armazenamento do navegador)? O sistema ficará 100% limpo com zero clientes, produtos, serviços, orçamentos e pedidos para você usar do zero.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClearZero}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                Sim, Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Restaurar Amostras */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Carregar Dados de Exemplo?
              </h3>
              <p className="text-xs text-slate-600">
                Isso irá carregar uma base de demonstração com produtos, vidros, clientes e orçamentos de exemplo para você testar as funcionalidades.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
              >
                Confirmar Amostras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
