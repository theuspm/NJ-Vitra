import React, { useState } from 'react';
import { Truck, Plus, Search, Phone, Mail, MapPin, Trash2, Edit2 } from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Supplier } from '../../types';

export const SuppliersView: React.FC = () => {
  const { suppliers, saveSupplier, deleteSupplier } = useVidracaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [tradeName, setTradeName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = suppliers.filter(
    (s) =>
      s.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.cnpj && s.cnpj.includes(searchTerm)) ||
      (s.document && s.document.includes(searchTerm))
  );

  const handleOpenNew = () => {
    setEditingSupplier(null);
    setTradeName('');
    setCompanyName('');
    setCnpj('');
    setContactName('');
    setPhone('');
    setEmail('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setTradeName(s.tradeName);
    setCompanyName(s.companyName);
    setCnpj(s.cnpj || s.document || '');
    setContactName(s.contactName || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setNotes(s.notes || '');
    setShowModal(true);
  };

  const handleSave = () => {
    if (!tradeName.trim() || !cnpj.trim()) {
      alert('Nome fantasia e CNPJ são obrigatórios.');
      return;
    }

    saveSupplier(
      {
        tradeName,
        companyName: companyName || tradeName,
        cnpj,
        contactName: contactName || undefined,
        phone,
        email: email || undefined,
        notes: notes || undefined,
        isActive: true,
      },
      editingSupplier ? editingSupplier.id : undefined
    );
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Fornecedores & Usinas de Vidro</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Cadastro de beneficiadores, distribuidores de chapas, extrusão de alumínio e ferragens
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar fornecedor por nome ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((sup) => (
          <div
            key={sup.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{sup.tradeName}</h2>
                  <p className="text-[11px] text-slate-700">{sup.companyName} • {sup.cnpj}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(sup)} className="p-1 text-slate-400 hover:text-blue-600">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover fornecedor ${sup.tradeName}?`)) deleteSupplier(sup.id);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sup.phone}</span>
                </div>
                {sup.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                )}
                {sup.notes && (
                  <p className="text-[11px] text-slate-700 italic pt-1 border-t border-slate-100">
                    {sup.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia *</label>
              <input
                type="text"
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNPJ *</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl">
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
