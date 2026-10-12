import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  DollarSign,
  History,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { Product, ProductKind, UnitOfMeasure } from '../../types';

export const ProductsView: React.FC = () => {
  const {
    products,
    categories,
    stocks,
    saveProduct,
    updateProductPrice,
    deleteProduct,
    priceHistories,
  } = useVidracaria();

  const [searchTerm, setSearchTerm] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('TODOS');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Modal de Preço
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [priceProdId, setPriceProdId] = useState('');
  const [newSalePrice, setNewSalePrice] = useState<number>(0);
  const [priceChangeReason, setPriceChangeReason] = useState('');

  // Form State
  const [internalCode, setInternalCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [kind, setKind] = useState<ProductKind>('VIDRO');
  const [unit, setUnit] = useState<UnitOfMeasure>('M2');
  const [thicknessMm, setThicknessMm] = useState<number>(8);
  const [color, setColor] = useState('Incolor');
  const [costPrice, setCostPrice] = useState<number>(100);
  const [salePrice, setSalePrice] = useState<number>(180);
  const [minStockAlert, setMinStockAlert] = useState<number>(20);

  const activeProducts = products.filter((p) => !p.deletedAt);

  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.internalCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKind = kindFilter === 'TODOS' || p.kind === kindFilter;
    return matchesSearch && matchesKind;
  });

  const handleOpenNew = () => {
    setEditingProduct(null);
    setInternalCode(`PRD-${Math.floor(100 + Math.random() * 900)}`);
    setName('');
    setKind('VIDRO');
    setUnit('M2');
    setThicknessMm(8);
    setColor('Incolor');
    setCostPrice(120);
    setSalePrice(210);
    setMinStockAlert(15);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setInternalCode(p.internalCode);
    setName(p.name);
    setCategoryId(p.categoryId);
    setKind(p.kind);
    setUnit(p.unit);
    setThicknessMm(p.thicknessMm || 0);
    setColor(p.color || '');
    setCostPrice(p.costPrice);
    setSalePrice(p.salePrice);
    setMinStockAlert(p.minStockAlert);
    setShowModal(true);
  };

  const handleOpenPriceChange = (p: Product) => {
    setPriceProdId(p.id);
    setNewSalePrice(p.salePrice);
    setPriceChangeReason('');
    setShowPriceModal(true);
  };

  const handleSaveProduct = () => {
    if (!name.trim() || !internalCode.trim()) {
      alert('Nome e código interno são obrigatórios.');
      return;
    }

    saveProduct(
      {
        internalCode,
        name,
        categoryId,
        kind,
        unit,
        thicknessMm: thicknessMm > 0 ? thicknessMm : undefined,
        color: color || undefined,
        costPrice,
        salePrice,
        minStockAlert,
        isActive: true,
      },
      editingProduct ? editingProduct.id : undefined
    );

    setShowModal(false);
  };

  const handleSavePriceChange = () => {
    if (!priceChangeReason.trim()) {
      alert('A justificativa do reajuste de preço é obrigatória para compliance de auditoria.');
      return;
    }
    updateProductPrice(priceProdId, newSalePrice, undefined, priceChangeReason);
    setShowPriceModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Catálogo de Produtos, Vidros & Acessórios</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Gestão de medidas técnicas, espessuras, regras por $m^2$ ou unidade e histórico de preços auditado
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Produto / Vidro</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome do produto ou código interno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
          />
        </div>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
        >
          <option value="TODOS">Todos os Tipos</option>
          <option value="VIDRO">Vidros</option>
          <option value="FERRAGEM">Ferragens</option>
          <option value="PERFIL_ALUMINIO">Perfis de Alumínio</option>
          <option value="KIT_BOX">Kits Prontos</option>
          <option value="INSUMO">Insumos (Silicone, Fitas)</option>
        </select>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Código</th>
              <th className="py-3 px-4">Produto</th>
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Unidade</th>
              <th className="py-3 px-4 text-right">Preço de Custo</th>
              <th className="py-3 px-4 text-right">Preço de Venda</th>
              <th className="py-3 px-4 text-right">Saldo Disponível</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredProducts.map((p) => {
              const stk = stocks.find((s) => s.productId === p.id);
              const margin = p.costPrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;

              return (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-blue-700">{p.internalCode}</td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    {p.thicknessMm && (
                      <p className="text-[11px] text-slate-700">
                        {p.thicknessMm}mm • {p.color || 'Padrão'}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                      {p.kind}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-700">{p.unit}</td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    R$ {p.costPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    R$ {p.salePrice.toFixed(2)}
                    <span className="text-[10px] text-emerald-600 block font-normal">
                      Margem: {margin.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={stk && stk.availableStock <= p.minStockAlert ? 'text-red-600' : 'text-slate-800'}>
                      {stk ? stk.availableStock : 0} {p.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenPriceChange(p)}
                        title="Reajustar Preço (com histórico auditado)"
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Desativar o produto ${p.name}?`)) deleteProduct(p.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center mx-auto mb-3">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nenhum produto ou vidro cadastrado
            </h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto leading-relaxed">
              Cadastre suas chapas de vidro por $m^2$, ferragens, perfis de alumínio e kits para compor seus orçamentos técnicos.
            </p>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto / Vidro</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: NOVO / EDITAR PRODUTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900">
              {editingProduct ? 'Editar Produto / Vidro' : 'Cadastrar Novo Item'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código Interno *</label>
                <input
                  type="text"
                  value={internalCode}
                  onChange={(e) => setInternalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Comercial *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Material</label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as ProductKind)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="VIDRO">Vidro</option>
                  <option value="FERRAGEM">Ferragem</option>
                  <option value="PERFIL_ALUMINIO">Perfil de Alumínio</option>
                  <option value="KIT_BOX">Kit Box</option>
                  <option value="INSUMO">Insumo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Unidade de Medida</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="M2">M² (Metro Quadrado)</option>
                  <option value="UN">UN (Unidade / Peça)</option>
                  <option value="ML">ML (Metro Linear)</option>
                  <option value="KG">KG (Quilo)</option>
                  <option value="KIT">KIT (Conjunto)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Espessura ($mm$)</label>
                <input
                  type="number"
                  value={thicknessMm}
                  onChange={(e) => setThicknessMm(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cor / Acabamento</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Custo (R$)</label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alerta Estoque Mínimo</label>
                <input
                  type="number"
                  value={minStockAlert}
                  onChange={(e) => setMinStockAlert(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Salvar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REAJUSTE DE PREÇO (COM AUDITORIA) */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>Reajuste de Preço de Tabela</span>
            </h3>

            <p className="text-xs text-slate-600">
              Esta alteração afetará novos orçamentos. Pedidos já confirmados manterão seus preços congelados.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Novo Preço de Venda (R$)</label>
              <input
                type="number"
                step="0.01"
                value={newSalePrice}
                onChange={(e) => setNewSalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Justificativa Obrigatória do Reajuste *
              </label>
              <input
                type="text"
                placeholder="Ex: Repasse de aumento da usina Cebrace de 6%"
                value={priceChangeReason}
                onChange={(e) => setPriceChangeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePriceChange}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Gravar Reajuste
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
