import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  ClipboardList,
  Plus,
  Search,
  RotateCcw,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  Lock,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { StockMovementType, MaterialLossReason } from '../../types';

export const StockView: React.FC = () => {
  const {
    stocks,
    products,
    stockMovements,
    materialLosses,
    registerStockMovement,
    executeInventoryCount,
    registerMaterialLoss,
  } = useVidracaria();

  const [activeSubTab, setActiveSubTab] = useState<'SALDOS' | 'MOVIMENTACOES' | 'PERDAS'>('SALDOS');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movProductId, setMovProductId] = useState(products[0]?.id || '');
  const [movType, setMovType] = useState<StockMovementType>('ENTRADA');
  const [movQuantity, setMovQuantity] = useState<number>(1);
  const [movReason, setMovReason] = useState<string>('');

  const [showLossModal, setShowLossModal] = useState(false);
  const [lossProductId, setLossProductId] = useState(products[0]?.id || '');
  const [lossQuantity, setLossQuantity] = useState<number>(1);
  const [lossReason, setLossReason] = useState<MaterialLossReason>('QUEBRA');
  const [lossNotes, setLossNotes] = useState('');

  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState<{ [productId: string]: number }>({});
  const [inventoryReason, setInventoryReason] = useState('Balanço físico mensal');

  const filteredStocks = stocks.filter((s) => {
    const prod = products.find((p) => p.id === s.productId);
    return (
      prod?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod?.internalCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveMovement = () => {
    if (!movReason.trim()) {
      alert('O motivo da movimentação de estoque é obrigatório para conformidade de auditoria.');
      return;
    }
    try {
      registerStockMovement(movProductId, movType, movQuantity, movReason);
      setShowMovementModal(false);
      setMovReason('');
      setMovQuantity(1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveLoss = () => {
    try {
      registerMaterialLoss(lossProductId, lossQuantity, lossReason, lossNotes);
      setShowLossModal(false);
      setLossNotes('');
      setLossQuantity(1);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveInventory = () => {
    const items = Object.entries(inventoryCounts).map(([prodId, countedQty]) => ({
      productId: prodId,
      countedQuantity: countedQty,
      adjustmentReason: inventoryReason,
    }));

    if (items.length === 0) {
      alert('Nenhum item alterado no inventário.');
      return;
    }

    executeInventoryCount(items);
    setShowInventoryModal(false);
    setInventoryCounts({});
    alert('Inventário consolidado com sucesso e saldos ajustados.');
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestão de Estoque & Materiais</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Controle de saldo físico, saldo reservado e saldo disponível ($Disponível = Físico - Reservado$)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLossModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Registrar Perda / Quebra</span>
          </button>
          <button
            onClick={() => setShowInventoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Realizar Inventário</span>
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('SALDOS')}
          className={`pb-3 px-3 transition-colors ${
            activeSubTab === 'SALDOS'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Posição de Estoque (Físico x Reservado x Disponível)
        </button>
        <button
          onClick={() => setActiveSubTab('MOVIMENTACOES')}
          className={`pb-3 px-3 transition-colors ${
            activeSubTab === 'MOVIMENTACOES'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Histórico de Movimentações ({stockMovements.length})
        </button>
        <button
          onClick={() => setActiveSubTab('PERDAS')}
          className={`pb-3 px-3 transition-colors ${
            activeSubTab === 'PERDAS'
              ? 'border-b-2 border-blue-600 text-blue-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Registro de Perdas & Quebras ({materialLosses.length})
        </button>
      </div>

      {activeSubTab === 'SALDOS' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por produto ou código..."
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
                  <th className="py-3 px-4">Produto / Vidro</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                  <th className="py-3 px-4 text-right">Estoque Físico</th>
                  <th className="py-3 px-4 text-right">Reservado (Pedidos)</th>
                  <th className="py-3 px-4 text-right">Disponível para Venda</th>
                  <th className="py-3 px-4 text-center">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStocks.map((stk) => {
                  const prod = products.find((p) => p.id === stk.productId);
                  const isLow = prod ? stk.availableStock <= prod.minStockAlert : false;

                  return (
                    <tr key={stk.productId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-700">{prod?.internalCode}</td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{prod?.name}</p>
                        <p className="text-[11px] text-slate-700">{prod?.kind} • {prod?.unit}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{stk.locationCode || 'Geral'}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {prod?.minStockAlert} {prod?.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {stk.physicalStock} {prod?.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">
                        {stk.reservedStock} {prod?.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        <span className={isLow ? 'text-red-600' : 'text-emerald-700'}>
                          {stk.availableStock} {prod?.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'MOVIMENTACOES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data/Hora</th>
                <th className="py-3 px-4">Produto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4 text-right">Físico Ant. / Novo</th>
                <th className="py-3 px-4">Motivo / Justificativa Obrigatória</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {stockMovements.map((mov) => (
                <tr key={mov.id}>
                  <td className="py-3 px-4 text-slate-700">
                    {new Date(mov.createdAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{mov.productName}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mov.type === 'ENTRADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : mov.type === 'RESERVA'
                          ? 'bg-amber-100 text-amber-800'
                          : mov.type === 'PERDA' || mov.type === 'AVARIA'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {mov.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {mov.quantity}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {mov.previousPhysical} → <strong className="text-slate-900">{mov.nextPhysical}</strong>
                  </td>
                  <td className="py-3 px-4 text-slate-700 italic">"{mov.reason}"</td>
                  <td className="py-3 px-4 text-slate-700">{mov.userName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'PERDAS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Material / Vidro</th>
                <th className="py-3 px-4">Motivo da Perda</th>
                <th className="py-3 px-4 text-right">Qtd Descartada</th>
                <th className="py-3 px-4">Observação Técnica</th>
                <th className="py-3 px-4">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {materialLosses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-600">
                    Nenhuma perda registrada.
                  </td>
                </tr>
              ) : (
                materialLosses.map((loss) => (
                  <tr key={loss.id}>
                    <td className="py-3 px-4 text-slate-700">
                      {new Date(loss.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{loss.productName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                        {loss.reason}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-red-600">
                      {loss.quantity}
                    </td>
                    <td className="py-3 px-4 text-slate-700 italic">{loss.notes || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{loss.userName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: NOVA MOVIMENTAÇÃO */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Movimentação de Estoque</h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Produto</label>
              <select
                value={movProductId}
                onChange={(e) => setMovProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.internalCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                <select
                  value={movType}
                  onChange={(e) => setMovType(e.target.value as StockMovementType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="ENTRADA">Entrada / Compra</option>
                  <option value="SAIDA">Saída Manual</option>
                  <option value="AVARIA">Avaria / Danificado</option>
                  <option value="DEVOLUCAO">Devolução</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={movQuantity}
                  onChange={(e) => setMovQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo / Documento (Obrigatório) *
              </label>
              <input
                type="text"
                placeholder="Ex: NF 1492 - Recebimento da Têmpera Paulista"
                value={movReason}
                onChange={(e) => setMovReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMovementModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMovement}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Salvar Movimentação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PERDA / QUEBRA */}
      {showLossModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Apontamento de Perda / Quebra de Material</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Produto / Vidro</label>
              <select
                value={lossProductId}
                onChange={(e) => setLossProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.internalCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo</label>
                <select
                  value={lossReason}
                  onChange={(e) => setLossReason(e.target.value as MaterialLossReason)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-700"
                >
                  <option value="QUEBRA">Quebra Espontânea / Transporte</option>
                  <option value="ERRO_CORTE">Erro de Corte / Medida</option>
                  <option value="AVARIA">Avaria em Manuseio</option>
                  <option value="DEFEITO_FABRICANTE">Defeito da Fábrica</option>
                  <option value="SOBRA_DESCARTE">Sobra não reutilizável</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Qtd Descartada</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={lossQuantity}
                  onChange={(e) => setLossQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Observações Técnicas</label>
              <textarea
                rows={2}
                value={lossNotes}
                onChange={(e) => setLossNotes(e.target.value)}
                placeholder="Detalhes do incidente para relatório de perdas"
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLossModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLoss}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl"
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INVENTÁRIO FÍSICO */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventário Físico & Ajuste de Saldo</h3>
              <p className="text-xs text-slate-600">
                Informe a quantidade real contada em prateleira/cavalete. O sistema calculará a diferença e registrará o ajuste auditado.
              </p>
            </div>

            <div className="space-y-3">
              {products.slice(0, 6).map((p) => {
                const stk = stocks.find((s) => s.productId === p.id);
                const currentPhysical = stk ? stk.physicalStock : 0;
                const counted = inventoryCounts[p.id] !== undefined ? inventoryCounts[p.id] : currentPhysical;
                const diff = counted - currentPhysical;

                return (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-600">
                        Saldo no Sistema: <strong>{currentPhysical} {p.unit}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-28">
                        <label className="block text-[10px] text-slate-600 font-bold mb-0.5">Contado:</label>
                        <input
                          type="number"
                          step="0.5"
                          value={counted}
                          onChange={(e) =>
                            setInventoryCounts({
                              ...inventoryCounts,
                              [p.id]: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-bold"
                        />
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-[10px] text-slate-600 font-bold block">Divergência:</span>
                        <span
                          className={`text-xs font-black ${
                            diff === 0 ? 'text-slate-600' : diff > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff} {p.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Ajuste *</label>
              <input
                type="text"
                value={inventoryReason}
                onChange={(e) => setInventoryReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowInventoryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInventory}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Consolidar Inventário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
