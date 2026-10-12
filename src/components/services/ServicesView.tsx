import React, { useState } from 'react';
import { Wrench, Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Service, UnitOfMeasure } from '../../types';

export const ServicesView: React.FC = () => {
  const { services, saveService, deleteService } = useVidracaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<UnitOfMeasure>('ML');
  const [costPrice, setCostPrice] = useState<number>(10);
  const [salePrice, setSalePrice] = useState<number>(25);
  const [description, setDescription] = useState('');

  const activeServices = services.filter((s) => !s.deletedAt);
  const filtered = activeServices.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenNew = () => {
    setEditingService(null);
    setCode(`SRV-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setUnit('ML');
    setCostPrice(10);
    setSalePrice(25);
    setDescription('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: Service) => {
    setEditingService(s);
    setCode(s.code);
    setName(s.name);
    setUnit(s.unit);
    setCostPrice(s.costPrice);
    setSalePrice(s.salePrice);
    setDescription(s.description || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim() || !code.trim()) {
      alert('Nome e código do serviço são obrigatórios.');
      return;
    }
    saveService(
      {
        code,
        name,
        description: description || undefined,
        unit,
        costPrice,
        salePrice,
        isActive: true,
      },
      editingService ? editingService.id : undefined
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Serviços de Beneficiamento & Instalação</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Tabela de mão de obra técnica, lapidação, bisotê, furação, recorte e taxas de montagem
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar serviço por nome ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Nome do Serviço</th>
              <th className="py-3 px-4">Unidade</th>
              <th className="py-3 px-4 text-right">Custo Base</th>
              <th className="py-3 px-4 text-right">Preço de Venda</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-blue-700">{s.code}</td>
                <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                <td className="py-3 px-4">{s.unit}</td>
                <td className="py-3 px-4 text-right text-slate-700">R$ {s.costPrice.toFixed(2)}</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">R$ {s.salePrice.toFixed(2)}</td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Desativar o serviço ${s.name}?`)) deleteService(s.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nenhum serviço cadastrado
            </h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
              Cadastre serviços como lapidação de bordas, furação em vidro, frete, medição no local ou instalação.
            </p>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Serviço</span>
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingService ? 'Editar Serviço' : 'Novo Serviço Técnico'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="ML">ML (Metro Linear - Lapidação)</option>
                  <option value="UN">UN (Unidade / Furo / Recorte)</option>
                  <option value="M2">M² (Instalação / Colocação)</option>
                  <option value="SERV">Serviço Global</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Serviço *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Custo Base (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Salvar Serviço
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
