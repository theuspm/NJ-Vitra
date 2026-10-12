import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, FileText } from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';

export const AuditView: React.FC = () => {
  const { auditLogs } = useVidracaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('TODOS');

  const filtered = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter === 'TODOS' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Trilha de Auditoria & Governança</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Registro imutável de todas as ações de usuários, alterações de preços, aprovações e movimentações de estoque
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por usuário, ação ou detalhe na trilha de auditoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
        >
          <option value="TODOS">Todas as Ações</option>
          <option value="CREATE_QUOTE">Criação de Orçamento</option>
          <option value="APPROVE_QUOTE">Aprovação de Orçamento</option>
          <option value="CONVERT_TO_ORDER">Conversão em Pedido</option>
          <option value="PRICE_CHANGE">Reajuste de Preço</option>
          <option value="STOCK_MOVEMENT">Movimento de Estoque</option>
          <option value="ADVANCE_PRODUCTION">Avanço de Produção</option>
          <option value="RECEIVE_PAYMENT">Recebimento de Pagamento</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Data/Hora</th>
              <th className="py-3 px-4">Usuário / Cargo</th>
              <th className="py-3 px-4">Ação</th>
              <th className="py-3 px-4">Entidade</th>
              <th className="py-3 px-4">Detalhes da Operação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString('pt-BR')}
                </td>
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{log.userName}</p>
                  <p className="text-[10px] text-blue-600 font-semibold">{log.userRole}</p>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                    {log.action}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-700">{log.entity}</td>
                <td className="py-3 px-4 text-slate-700">{log.details || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
