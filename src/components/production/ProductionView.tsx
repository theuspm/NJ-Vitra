import React, { useState } from 'react';
import {
  Factory,
  CheckCircle2,
  Clock,
  Camera,
  Plus,
  Compass,
  ArrowRight,
  User,
  Calendar,
  AlertCircle,
  FileCheck,
  Check,
} from 'lucide-react';
import { useVidracaria } from '../../context/VidracariaContext';
import { ProductionOrder, ProductionStage } from '../../types';

export const ProductionView: React.FC = () => {
  const { productionOrders, advanceProductionStep, addMeasurement } = useVidracaria();
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  // Modal de Medição
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [environment, setEnvironment] = useState('Banheiro Suíte');
  const [measWidth, setMeasWidth] = useState(1200);
  const [measHeight, setMeasHeight] = useState(1900);
  const [measThickness, setMeasThickness] = useState(8);
  const [measGlassType, setMeasGlassType] = useState('Temperado Incolor 8mm');
  const [measNotes, setMeasNotes] = useState('Desaprumo de 5mm na parede esquerda.');

  const STAGES: Array<{ key: ProductionStage; label: string }> = [
    { key: 'MEDICAO', label: '1. Medição' },
    { key: 'PROJETO', label: '2. Projeto' },
    { key: 'CORTE', label: '3. Corte' },
    { key: 'BENEFICIAMENTO', label: '4. Beneficiamento' },
    { key: 'MONTAGEM', label: '5. Montagem' },
    { key: 'EXPEDICAO', label: '6. Expedição' },
    { key: 'INSTALACAO', label: '7. Instalação' },
    { key: 'CONCLUIDO', label: '8. Concluído' },
  ];

  const handleSaveMeasurement = () => {
    if (!selectedOrder) return;
    addMeasurement(selectedOrder.id, {
      environment,
      widthMm: measWidth,
      heightMm: measHeight,
      thicknessMm: measThickness,
      glassType: measGlassType,
      notes: measNotes,
    });
    setShowMeasurementModal(false);
    // Atualiza selecionado
    const updated = productionOrders.find((p) => p.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  };

  const handleAdvanceStep = (stepIndex: number) => {
    if (!selectedOrder) return;
    advanceProductionStep(selectedOrder.id, stepIndex);
    const updated = productionOrders.find((p) => p.id === selectedOrder.id);
    if (updated) setSelectedOrder(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Produção, Beneficiamento & Instalação</h1>
          <p className="text-xs text-slate-700 mt-0.5">
            Fluxo técnico das 7 etapas especializadas da vidraçaria com apontamento de medições in loco
          </p>
        </div>
      </div>

      {/* Grid de Ordens de Produção / Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productionOrders.map((po) => {
          const currentStageIndex = STAGES.findIndex((s) => s.key === po.currentStage);
          const isFinished = po.currentStage === 'CONCLUIDO';

          return (
            <div
              key={po.id}
              onClick={() => setSelectedOrder(po)}
              className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                selectedOrder?.id === po.id
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20'
                  : 'border-slate-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">
                    {po.orderNumber}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      isFinished
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {po.currentStage}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1">
                  Cliente: <strong className="text-slate-800">{po.customerName}</strong>
                </p>

                {/* Barra de Progresso das 7 Etapas */}
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-1">
                    <span>Etapa {currentStageIndex + 1} de {STAGES.length}</span>
                    <span>{Math.round(((currentStageIndex + 1) / STAGES.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{
                        width: `${((currentStageIndex + 1) / STAGES.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Medições registradas */}
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-700">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {po.measurements.length} medição(ões) in loco cadastradas
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-700">
                  Início: {new Date(po.startDate || po.createdAt).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-blue-600 hover:underline">
                  Gerenciar Etapas
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhe da Ordem de Produção Selecionada */}
      {selectedOrder && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Ordem de Serviço #{selectedOrder.orderNumber}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {selectedOrder.currentStage}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Cliente: <strong>{selectedOrder.customerName}</strong>
              </p>
            </div>

            <button
              onClick={() => setShowMeasurementModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Compass className="w-4 h-4" />
              <span>Registrar Medição In Loco</span>
            </button>
          </div>

          {/* Medições In Loco já Apontadas */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Medições Técnicas In Loco ({selectedOrder.measurements.length})</span>
            </h3>

            {selectedOrder.measurements.length === 0 ? (
              <p className="text-xs text-slate-600 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                Nenhuma medição técnica cadastrada ainda. Clique em "Registrar Medição In Loco" para lançar as medidas reais do vão.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedOrder.measurements.map((m) => (
                  <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{m.environment}</span>
                      <span className="text-[10px] text-slate-600">{new Date(m.measuredAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-blue-700 font-semibold">
                      Vão: {m.widthMm} x {m.heightMm} mm ({m.thicknessMm}mm - {m.glassType})
                    </p>
                    {m.notes && <p className="text-[11px] text-slate-600 italic">Obs: {m.notes}</p>}
                    <p className="text-[10px] text-slate-600">Medido por: {m.measuredByUserName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stepper das 7 Etapas da Vidraçaria */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Checklist das Etapas Industriais
            </h3>

            <div className="space-y-2">
              {selectedOrder.steps.map((step, idx) => {
                const isCompleted = step.status === 'CONCLUIDO';
                const isCurrent = step.stage === selectedOrder.currentStage;

                return (
                  <div
                    key={step.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      isCompleted
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : isCurrent
                        ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {STAGES[idx]?.label}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {isCompleted
                            ? `Concluído por ${step.assignedUserName || 'Técnico'} em ${new Date(step.completedAt!).toLocaleDateString('pt-BR')}`
                            : isCurrent
                            ? 'Etapa em execução na fábrica'
                            : 'Aguardando etapa anterior'}
                        </p>
                      </div>
                    </div>

                    {isCurrent && (
                      <button
                        onClick={() => handleAdvanceStep(idx)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        <span>Concluir Etapa</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR MEDIÇÃO IN LOCO */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Apontamento de Medição Técnica In Loco</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ambiente / Cômodo</label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                placeholder="Ex: Banheiro Suíte Master, Sacada, Janela Cozinha"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Largura ($mm$)</label>
                <input
                  type="number"
                  value={measWidth}
                  onChange={(e) => setMeasWidth(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Altura ($mm$)</label>
                <input
                  type="number"
                  value={measHeight}
                  onChange={(e) => setMeasHeight(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-700 mb-1">Espessura</label>
                <input
                  type="number"
                  value={measThickness}
                  onChange={(e) => setMeasThickness(Number(e.target.value))}
                  className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Vidro</label>
              <input
                type="text"
                value={measGlassType}
                onChange={(e) => setMeasGlassType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Anotações de Obra (desaprumo, nível, interferências)
              </label>
              <textarea
                rows={2}
                value={measNotes}
                onChange={(e) => setMeasNotes(e.target.value)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMeasurement}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Salvar Medição
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
