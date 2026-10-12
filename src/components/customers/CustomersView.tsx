import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  Building,
  User,
  History,
  CheckCircle,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Customer, CustomerType } from '../../types';

export const CustomersView: React.FC = () => {
  const { customers, saveCustomer, deleteCustomer, quotes, orders, receivables } = useVidracaria();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [type, setType] = useState<CustomerType>('PESSOA_FISICA');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [postalCode, setPostalCode] = useState('');
  const [notes, setNotes] = useState('');

  const activeCustomers = customers.filter((c) => !c.deletedAt);

  const filteredCustomers = activeCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.document.includes(searchTerm) ||
      c.phone.includes(searchTerm) ||
      c.whatsapp.includes(searchTerm)
  );

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setType('PESSOA_FISICA');
    setName('');
    setTradeName('');
    setDocument('');
    setStateRegistration('');
    setPhone('');
    setWhatsapp('');
    setEmail('');
    setStreet('');
    setNumber('');
    setComplement('');
    setNeighborhood('');
    setCity('São Paulo');
    setState('SP');
    setPostalCode('');
    setNotes('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setType(c.type);
    setName(c.name);
    setTradeName(c.tradeName || '');
    setDocument(c.document);
    setStateRegistration(c.stateRegistration || '');
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setEmail(c.email || '');
    setNotes(c.notes || '');

    const addr = c.addresses[0];
    if (addr) {
      setStreet(addr.street);
      setNumber(addr.number);
      setComplement(addr.complement || '');
      setNeighborhood(addr.neighborhood);
      setCity(addr.city);
      setState(addr.state);
      setPostalCode(addr.postalCode || addr.zipCode || '');
    }
    setShowModal(true);
  };

  const handleSave = () => {
    if (!name.trim() || !document.trim() || !phone.trim()) {
      alert('Nome, CPF/CNPJ e Telefone são campos obrigatórios.');
      return;
    }

    const address = {
      id: `addr-${Date.now()}`,
      customerId: editingCustomer ? editingCustomer.id : '',
      type: 'PRINCIPAL' as const,
      isDefault: true,
      street: street || 'Rua Principal',
      number: number || 'S/N',
      complement: complement || undefined,
      neighborhood: neighborhood || 'Centro',
      city: city || 'São Paulo',
      state: state || 'SP',
      postalCode: postalCode || '01000-000',
    };

    saveCustomer(
      {
        type,
        name,
        tradeName: tradeName || undefined,
        document,
        stateRegistration: stateRegistration || undefined,
        phone,
        whatsapp: whatsapp || phone,
        email: email || undefined,
        notes: notes || undefined,
        addresses: [address],
      },
      editingCustomer ? editingCustomer.id : undefined
    );

    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja desativar este cliente? O histórico de pedidos será mantido.')) {
      deleteCustomer(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Carteira de Clientes</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Cadastro completo PF/PJ com múltiplos endereços de instalação e histórico financeiro
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar cliente por nome, documento ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl"
        />
      </div>

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custQuotes = quotes.filter((q) => q.customerId === cust.id);
          const custOrders = orders.filter((o) => o.customerId === cust.id);
          const custDebt = receivables
            .filter((r) => r.customerId === cust.id && r.status !== 'PAGO')
            .reduce((acc, r) => acc + r.balanceDue, 0);

          return (
            <div
              key={cust.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                      {cust.type === 'PESSOA_JURIDICA' ? (
                        <Building className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 leading-tight">
                        {cust.name}
                      </h2>
                      <p className="text-[10px] text-slate-700">
                        {cust.type === 'PESSOA_JURIDICA' ? 'Pessoa Jurídica' : 'Pessoa Física'} • {cust.document}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(cust)}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contatos */}
                <div className="mt-4 space-y-1.5 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.phone}</span>
                    </span>
                    {cust.whatsapp && (
                      <a
                        href={`https://wa.me/55${cust.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {cust.email && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                  )}

                  {cust.addresses[0] && (
                    <div className="flex items-start gap-1.5 text-[11px] text-slate-700 pt-1 border-t border-slate-100">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {cust.addresses[0].street}, {cust.addresses[0].number} - {cust.addresses[0].neighborhood}, {cust.addresses[0].city}/{cust.addresses[0].state}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Histórico Comercial Resumido */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-700">
                  <strong>{custQuotes.length}</strong> orç. / <strong>{custOrders.length}</strong> ped.
                </span>
                {custDebt > 0 ? (
                  <span className="font-bold text-red-600 text-[11px]">
                    Débito: R$ {custDebt.toFixed(2)}
                  </span>
                ) : (
                  <span className="font-bold text-emerald-600 text-[11px]">Em dia</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Nenhum cliente cadastrado ainda
          </h3>
          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            Seu banco de dados está pronto para o uso. Cadastre pessoas físicas (CPF) ou jurídicas (CNPJ) para gerar seus orçamentos e pedidos.
          </p>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Cliente</span>
          </button>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR CLIENTE */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900">
              {editingCustomer ? 'Editar Cadastro de Cliente' : 'Novo Cliente'}
            </h3>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setType('PESSOA_FISICA')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'PESSOA_FISICA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Pessoa Física (CPF)
              </button>
              <button
                type="button"
                onClick={() => setType('PESSOA_JURIDICA')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'PESSOA_JURIDICA'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Pessoa Jurídica (CNPJ)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {type === 'PESSOA_JURIDICA' ? 'Razão Social *' : 'Nome Completo *'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {type === 'PESSOA_JURIDICA' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome Fantasia</label>
                  <input
                    type="text"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {type === 'PESSOA_JURIDICA' ? 'CNPJ *' : 'CPF *'}
                </label>
                <input
                  type="text"
                  value={document}
                  onChange={(e) => setDocument(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {type === 'PESSOA_JURIDICA' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal *</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Comercial</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase block mb-2">
                Endereço Padrão de Entrega / Instalação
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Logradouro</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Número</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Bairro</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">UF</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
