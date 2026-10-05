/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  INITIAL_LINE_B_CONFIG, 
  INITIAL_LINE_B_STATIONS, 
  INITIAL_LINE_B_IDL, 
  INITIAL_LINE_B_SPARE,
  INITIAL_LINE_A_CONFIG,
  INITIAL_LINE_A_STATIONS,
  INITIAL_LINE_A_IDL,
  INITIAL_LINE_A_SPARE,
  INITIAL_MODEL_VOLUMES
} from './data/initialData';
import { 
  StationData, 
  IndirectLaborData, 
  SpareLaborData, 
  ProductionLineConfig, 
  ActiveLine,
  ModelVolumeItem
} from './types';
import { calculateIEMetrics, exportToCSV } from './utils/ieCalculations';
import { Header } from './components/Header';
import { ManningTable } from './components/ManningTable';
import { LineBalancingView } from './components/LineBalancingView';
import { IECalculator } from './components/IECalculator';
import { KaizenSimulator } from './components/KaizenSimulator';
import { ProcessCards } from './components/ProcessCards';
import { PlantOverview } from './components/PlantOverview';
import { DashboardSummary } from './components/DashboardSummary';
import { ReportModal } from './components/ReportModal';
import { VolumeModelManagement } from './components/VolumeModelManagement';
import { VolumeForecastSheet } from './components/VolumeForecastSheet';

export default function App() {
  // Active production line selector: 'line-b' (default) | 'line-a' | 'plant-overview'
  const [activeLine, setActiveLine] = useState<ActiveLine>('line-b');

  // Line B states (Original document)
  const [stationsB, setStationsB] = useState<StationData[]>(INITIAL_LINE_B_STATIONS);
  const [idlListB, setIdlListB] = useState<IndirectLaborData[]>(INITIAL_LINE_B_IDL);
  const [sparesListB, setSparesListB] = useState<SpareLaborData[]>(INITIAL_LINE_B_SPARE);
  const [configB, setConfigB] = useState<ProductionLineConfig>(INITIAL_LINE_B_CONFIG);

  // Line A states (A-Line)
  const [stationsA, setStationsA] = useState<StationData[]>(INITIAL_LINE_A_STATIONS);
  const [idlListA, setIdlListA] = useState<IndirectLaborData[]>(INITIAL_LINE_A_IDL);
  const [sparesListA, setSparesListA] = useState<SpareLaborData[]>(INITIAL_LINE_A_SPARE);
  const [configA, setConfigA] = useState<ProductionLineConfig>(INITIAL_LINE_A_CONFIG);

  // Dynamic Model Volumes State with full CRUD, formula binding, and localStorage auto-save
  const [modelVolumes, setModelVolumes] = useState<ModelVolumeItem[]>(() => {
    try {
      const saved = localStorage.getItem('ie_line_b_model_volumes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved model volumes:', e);
    }
    return INITIAL_MODEL_VOLUMES;
  });

  // Auto-save model volumes to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem('ie_line_b_model_volumes', JSON.stringify(modelVolumes));
    } catch (e) {
      console.error('Error saving model volumes to localStorage:', e);
    }
  }, [modelVolumes]);

  // Model Volume Handlers
  const handleAddModelVolume = (item: Omit<ModelVolumeItem, 'id'>) => {
    const newItem: ModelVolumeItem = {
      ...item,
      id: `vol-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setModelVolumes((prev) => {
      const updated = [...prev, newItem];
      // Recalculate target daily outputs
      const volA = updated.filter((m) => m.line === 'line-a').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      const volB = updated.filter((m) => m.line === 'line-b').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      if (item.line === 'line-a' && volA > 0) {
        setConfigA((c) => ({ ...c, targetDailyOutput: volA }));
      } else if (item.line === 'line-b' && volB > 0) {
        setConfigB((c) => ({ ...c, targetDailyOutput: volB }));
      }
      return updated;
    });
  };

  const handleUpdateModelVolume = (id: string, updates: Partial<ModelVolumeItem>) => {
    setModelVolumes((prev) => {
      const updated = prev.map((m) => (m.id === id ? { ...m, ...updates } : m));
      const volA = updated.filter((m) => m.line === 'line-a').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      const volB = updated.filter((m) => m.line === 'line-b').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      if (volA > 0) setConfigA((c) => ({ ...c, targetDailyOutput: volA }));
      if (volB > 0) setConfigB((c) => ({ ...c, targetDailyOutput: volB }));
      return updated;
    });
  };

  const handleDeleteModelVolume = (id: string) => {
    setModelVolumes((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      const volA = updated.filter((m) => m.line === 'line-a').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      const volB = updated.filter((m) => m.line === 'line-b').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
      setConfigA((c) => ({ ...c, targetDailyOutput: volA || 1000 }));
      setConfigB((c) => ({ ...c, targetDailyOutput: volB || 1000 }));
      return updated;
    });
  };

  const handleResetModelVolumes = () => {
    try {
      localStorage.removeItem('ie_line_b_model_volumes');
    } catch (e) {
      console.error(e);
    }
    setModelVolumes(INITIAL_MODEL_VOLUMES);
    const volA = INITIAL_MODEL_VOLUMES.filter((m) => m.line === 'line-a').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
    const volB = INITIAL_MODEL_VOLUMES.filter((m) => m.line === 'line-b').reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
    setConfigA((c) => ({ ...c, targetDailyOutput: volA }));
    setConfigB((c) => ({ ...c, targetDailyOutput: volB }));
  };

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Active line pointer
  const isLineA = activeLine === 'line-a';
  const currentStations = isLineA ? stationsA : stationsB;
  const currentIdl = isLineA ? idlListA : idlListB;
  const currentSpares = isLineA ? sparesListA : sparesListB;
  const currentConfig = isLineA ? configA : configB;

  // Setters for active line
  const setCurrentStations = isLineA ? setStationsA : setStationsB;
  const setCurrentIdl = isLineA ? setIdlListA : setIdlListB;
  const setCurrentSpares = isLineA ? setSparesListA : setSparesListB;
  const setCurrentConfig = isLineA ? setConfigA : setConfigB;

  // Memoized metrics calculations
  const metricsB = useMemo(() => {
    return calculateIEMetrics(stationsB, idlListB, sparesListB, configB);
  }, [stationsB, idlListB, sparesListB, configB]);

  const metricsA = useMemo(() => {
    return calculateIEMetrics(stationsA, idlListA, sparesListA, configA);
  }, [stationsA, idlListA, sparesListA, configA]);

  const currentMetrics = isLineA ? metricsA : metricsB;

  const baselineMetrics = useMemo(() => {
    return isLineA
      ? calculateIEMetrics(INITIAL_LINE_A_STATIONS, INITIAL_LINE_A_IDL, INITIAL_LINE_A_SPARE, INITIAL_LINE_A_CONFIG)
      : calculateIEMetrics(INITIAL_LINE_B_STATIONS, INITIAL_LINE_B_IDL, INITIAL_LINE_B_SPARE, INITIAL_LINE_B_CONFIG);
  }, [isLineA]);

  const isModified = useMemo(() => {
    if (isLineA) {
      return (
        JSON.stringify(stationsA) !== JSON.stringify(INITIAL_LINE_A_STATIONS) ||
        JSON.stringify(idlListA) !== JSON.stringify(INITIAL_LINE_A_IDL) ||
        JSON.stringify(sparesListA) !== JSON.stringify(INITIAL_LINE_A_SPARE) ||
        configA.targetUph !== INITIAL_LINE_A_CONFIG.targetUph
      );
    }
    return (
      JSON.stringify(stationsB) !== JSON.stringify(INITIAL_LINE_B_STATIONS) ||
      JSON.stringify(idlListB) !== JSON.stringify(INITIAL_LINE_B_IDL) ||
      JSON.stringify(sparesListB) !== JSON.stringify(INITIAL_LINE_B_SPARE) ||
      configB.targetUph !== INITIAL_LINE_B_CONFIG.targetUph
    );
  }, [isLineA, stationsA, idlListA, sparesListA, configA, stationsB, idlListB, sparesListB, configB]);

  // Handlers for active line editing
  const handleUpdateStation = (id: string, updates: Partial<StationData>) => {
    setCurrentStations((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const handleUpdateIDL = (id: string, stdMp: number, title?: string) => {
    setCurrentIdl((prev) =>
      prev.map((item) => (item.id === id ? { ...item, stdMp, ...(title ? { title } : {}) } : item))
    );
  };

  const handleUpdateSpare = (id: string, stdMp: number) => {
    setCurrentSpares((prev) =>
      prev.map((sp) => (sp.id === id ? { ...sp, stdMp } : sp))
    );
  };

  const handleUpdateConfig = (updates: Partial<ProductionLineConfig>) => {
    setCurrentConfig((prev) => ({ ...prev, ...updates }));
  };

  const handleResetToBaseline = () => {
    if (isLineA) {
      setStationsA(INITIAL_LINE_A_STATIONS);
      setIdlListA(INITIAL_LINE_A_IDL);
      setSparesListA(INITIAL_LINE_A_SPARE);
      setConfigA(INITIAL_LINE_A_CONFIG);
    } else {
      setStationsB(INITIAL_LINE_B_STATIONS);
      setIdlListB(INITIAL_LINE_B_IDL);
      setSparesListB(INITIAL_LINE_B_SPARE);
      setConfigB(INITIAL_LINE_B_CONFIG);
    }
  };

  // Add station row
  const handleAddStation = (shift: 'Shift-A' | 'Shift-B') => {
    const nextNo = Math.max(...currentStations.map((s) => s.no), 0) + 1;
    const prefix = isLineA ? 'a' : 'b';
    const newStationA: StationData = {
      id: `${prefix}-station-${nextNo}-shift-a`,
      no: nextNo,
      name: `New Process #${nextNo} (Shift-A)`,
      thaiName: `สถานีงานใหม่ #${nextNo} (กะ A)`,
      shift: 'Shift-A',
      type: 'DL',
      stdMp: 10,
      uph: currentConfig.targetUph,
      ct: currentConfig.designCycleTimeSec,
      upph: Math.round(currentConfig.targetUph / 10),
      outputPerShift: Math.round((currentConfig.targetUph * currentConfig.netShiftHours) / 10),
    };
    const newStationB: StationData = {
      id: `${prefix}-station-${nextNo}-shift-b`,
      no: nextNo,
      name: `New Process #${nextNo} (Shift-B)`,
      thaiName: `สถานีงานใหม่ #${nextNo} (กะ B)`,
      shift: 'Shift-B',
      type: 'DL',
      stdMp: 10,
      uph: currentConfig.targetUph,
      ct: currentConfig.designCycleTimeSec,
      upph: Math.round(currentConfig.targetUph / 10),
      outputPerShift: Math.round((currentConfig.targetUph * currentConfig.netShiftHours) / 10),
    };
    setCurrentStations((prev) => [...prev, newStationA, newStationB]);
  };

  // Delete station row
  const handleDeleteStation = (id: string) => {
    const target = currentStations.find((s) => s.id === id);
    if (!target) return;
    // Delete both shift A and shift B for this station number
    setCurrentStations((prev) => prev.filter((s) => s.no !== target.no));
  };

  // Add IDL role
  const handleAddIDL = () => {
    const prefix = isLineA ? 'a' : 'b';
    const newIdl: IndirectLaborData = {
      id: `${prefix}-idl-${Date.now()}`,
      title: 'New IDL Role',
      thaiTitle: 'ตำแหน่งสนับสนุนใหม่',
      type: 'IDL',
      stdMp: 1,
      description: 'ตำแหน่งสนับสนุนฝ่ายผลิตเพิ่มเติม',
    };
    setCurrentIdl((prev) => [...prev, newIdl]);
  };

  // Delete IDL
  const handleDeleteIDL = (id: string) => {
    setCurrentIdl((prev) => prev.filter((item) => item.id !== id));
  };

  // Batch update UPH for all stations
  const handleBatchUpdateUph = (newUph: number) => {
    setCurrentStations((prev) =>
      prev.map((s) => {
        const newUpph = Math.round(newUph / (s.stdMp || 1));
        const newOutput = Math.round((newUph * currentConfig.netShiftHours) / (s.stdMp || 1));
        return { ...s, uph: newUph, upph: newUpph, outputPerShift: newOutput };
      })
    );
    handleUpdateConfig({ targetUph: newUph });
  };

  const handleBatchUpdateUphA = (newUph: number) => {
    setStationsA((prev) =>
      prev.map((s) => {
        const newUpph = Math.round(newUph / (s.stdMp || 1));
        const newOutput = Math.round((newUph * configA.netShiftHours) / (s.stdMp || 1));
        return { ...s, uph: newUph, upph: newUpph, outputPerShift: newOutput };
      })
    );
    setConfigA((prev) => ({ ...prev, targetUph: newUph }));
  };

  const handleBatchUpdateUphB = (newUph: number) => {
    setStationsB((prev) =>
      prev.map((s) => {
        const newUpph = Math.round(newUph / (s.stdMp || 1));
        const newOutput = Math.round((newUph * configB.netShiftHours) / (s.stdMp || 1));
        return { ...s, uph: newUph, upph: newUpph, outputPerShift: newOutput };
      })
    );
    setConfigB((prev) => ({ ...prev, targetUph: newUph }));
  };

  // Batch update CT for all stations
  const handleBatchUpdateCt = (newCt: number) => {
    setCurrentStations((prev) =>
      prev.map((s) => ({ ...s, ct: newCt }))
    );
    handleUpdateConfig({ designCycleTimeSec: newCt });
  };

  // Copy Shift A to Shift B
  const handleCopyShiftAtoB = () => {
    const shiftA = currentStations.filter((s) => s.shift === 'Shift-A');
    setCurrentStations((prev) =>
      prev.map((st) => {
        if (st.shift === 'Shift-B') {
          const matchA = shiftA.find((a) => a.no === st.no);
          if (matchA) {
            return {
              ...st,
              name: matchA.name.replace('Shift-A', 'Shift-B'),
              stdMp: matchA.stdMp,
              uph: matchA.uph,
              ct: matchA.ct,
              upph: matchA.upph,
              outputPerShift: matchA.outputPerShift,
            };
          }
        }
        return st;
      })
    );
  };

  // Specific handlers for Line A and Line B
  const handleUpdateStationA = (id: string, updates: Partial<StationData>) => {
    setStationsA((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleUpdateStationB = (id: string, updates: Partial<StationData>) => {
    setStationsB((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleUpdateConfigA = (updates: Partial<ProductionLineConfig>) => {
    setConfigA((prev) => ({ ...prev, ...updates }));
  };

  const handleUpdateConfigB = (updates: Partial<ProductionLineConfig>) => {
    setConfigB((prev) => ({ ...prev, ...updates }));
  };

  const handleApplyKaizen = (
    newStations: StationData[],
    newConfig: ProductionLineConfig,
    newIdl: IndirectLaborData[],
    newSpares: SpareLaborData[]
  ) => {
    setCurrentStations(newStations);
    setCurrentConfig(newConfig);
    setCurrentIdl(newIdl);
    setCurrentSpares(newSpares);
    setActiveTab('manning');
  };

  const handleExportCSV = () => {
    exportToCSV(currentStations, currentIdl, currentSpares, currentConfig);
  };

  const totalPlantDailyOutput = configA.targetDailyOutput + configB.targetDailyOutput;
  const totalPlantHeadcount = metricsA.grandTotalHeadcount + metricsB.grandTotalHeadcount;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header & Multi-Line Navigation */}
      <Header
        activeLine={activeLine}
        setActiveLine={setActiveLine}
        config={currentConfig}
        metrics={currentMetrics}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportCSV={handleExportCSV}
        onOpenReport={() => setIsReportOpen(true)}
        onReset={handleResetToBaseline}
        isModified={isModified}
        totalPlantHeadcount={totalPlantHeadcount}
        totalPlantDailyOutput={totalPlantDailyOutput}
        volumeA={configA.targetDailyOutput}
        volumeB={configB.targetDailyOutput}
        modelA={configA.model}
        modelB={configB.model}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Summary 1 */}
        {activeTab === 'dashboard' && (
          <DashboardSummary
            modelVolumes={modelVolumes}
            onAddModelVolume={handleAddModelVolume}
            onUpdateModelVolume={handleUpdateModelVolume}
            onDeleteModelVolume={handleDeleteModelVolume}
            onResetModelVolumes={handleResetModelVolumes}
            lineAData={{ config: configA, stations: stationsA, metrics: metricsA }}
            lineBData={{ config: configB, stations: stationsB, metrics: metricsB }}
            onSelectLine={(lineId) => setActiveLine(lineId)}
            onNavigateTab={(tabId) => setActiveTab(tabId)}
            onUpdateConfigA={handleUpdateConfigA}
            onUpdateConfigB={handleUpdateConfigB}
            onUpdateStationA={handleUpdateStationA}
            onUpdateStationB={handleUpdateStationB}
            onBatchUpdateUphA={handleBatchUpdateUphA}
            onBatchUpdateUphB={handleBatchUpdateUphB}
          />
        )}

        {/* Volume Forecast by Model Sheet (TT, CT & Accurate MP Planning) */}
        {activeTab === 'forecast' && (
          <VolumeForecastSheet
            modelVolumes={modelVolumes}
            onAddModelVolume={handleAddModelVolume}
            onUpdateModelVolume={handleUpdateModelVolume}
            onDeleteModelVolume={handleDeleteModelVolume}
            lineAConfig={configA}
            lineAMetrics={metricsA}
            lineBConfig={configB}
            lineBMetrics={metricsB}
            stationsA={stationsA}
            stationsB={stationsB}
            onBatchUpdateUphA={handleBatchUpdateUphA}
            onBatchUpdateUphB={handleBatchUpdateUphB}
            onNavigateTab={(tabId) => setActiveTab(tabId)}
          />
        )}

        {/* Model Production Plan Tab */}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <VolumeModelManagement
              modelVolumes={modelVolumes}
              onAddModelVolume={handleAddModelVolume}
              onUpdateModelVolume={handleUpdateModelVolume}
              onDeleteModelVolume={handleDeleteModelVolume}
              onResetModelVolumes={handleResetModelVolumes}
              lineAConfig={configA}
              lineAMetrics={metricsA}
              lineBConfig={configB}
              lineBMetrics={metricsB}
              onUpdateConfigA={handleUpdateConfigA}
              onUpdateConfigB={handleUpdateConfigB}
              onBatchUpdateUphA={handleBatchUpdateUphA}
              onBatchUpdateUphB={handleBatchUpdateUphB}
              onSelectLine={(lineId) => setActiveLine(lineId)}
            />
          </div>
        )}

        {/* Plant Overview Screen */}
        {activeLine === 'plant-overview' && activeTab !== 'dashboard' && (
          <PlantOverview
            modelVolumes={modelVolumes}
            onAddModelVolume={handleAddModelVolume}
            onUpdateModelVolume={handleUpdateModelVolume}
            onDeleteModelVolume={handleDeleteModelVolume}
            onResetModelVolumes={handleResetModelVolumes}
            lineAData={{ config: configA, stations: stationsA, metrics: metricsA }}
            lineBData={{ config: configB, stations: stationsB, metrics: metricsB }}
            onSelectLine={(lineId) => setActiveLine(lineId)}
            onUpdateStationA={handleUpdateStationA}
            onUpdateStationB={handleUpdateStationB}
            onUpdateConfigA={handleUpdateConfigA}
            onUpdateConfigB={handleUpdateConfigB}
            onBatchUpdateUphA={handleBatchUpdateUphA}
            onBatchUpdateUphB={handleBatchUpdateUphB}
          />
        )}

        {/* Manning Table for Active Line */}
        {activeLine !== 'plant-overview' && activeTab === 'manning' && (
          <ManningTable
            stations={currentStations}
            idlList={currentIdl}
            sparesList={currentSpares}
            config={currentConfig}
            metrics={currentMetrics}
            onUpdateStation={handleUpdateStation}
            onUpdateIDL={handleUpdateIDL}
            onUpdateSpare={handleUpdateSpare}
            onUpdateConfig={handleUpdateConfig}
            onAddStation={handleAddStation}
            onDeleteStation={handleDeleteStation}
            onAddIDL={handleAddIDL}
            onDeleteIDL={handleDeleteIDL}
            onBatchUpdateUph={handleBatchUpdateUph}
            onBatchUpdateCt={handleBatchUpdateCt}
            onCopyShiftAtoB={handleCopyShiftAtoB}
          />
        )}

        {/* Line Balancing View */}
        {activeLine !== 'plant-overview' && activeTab === 'balancing' && (
          <LineBalancingView
            stations={currentStations}
            config={currentConfig}
            metrics={currentMetrics}
            onUpdateStation={handleUpdateStation}
          />
        )}

        {/* IE Calculator */}
        {activeLine !== 'plant-overview' && activeTab === 'calculator' && (
          <IECalculator
            config={currentConfig}
            metrics={currentMetrics}
            onUpdateConfig={handleUpdateConfig}
          />
        )}

        {/* Kaizen Simulator */}
        {activeLine !== 'plant-overview' && activeTab === 'kaizen' && (
          <KaizenSimulator
            stations={currentStations}
            idlList={currentIdl}
            sparesList={currentSpares}
            config={currentConfig}
            baselineMetrics={baselineMetrics}
            onApplyKaizenToMaster={handleApplyKaizen}
          />
        )}

        {/* Process Breakdown */}
        {activeLine !== 'plant-overview' && activeTab === 'process' && (
          <ProcessCards stations={currentStations} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-slate-700">Refrigerator Production IE Suite</span> · Line A (BM350) & Line B (BM400)
          </div>
          <div className="flex items-center gap-4">
            <span>Plant Output: {totalPlantDailyOutput.toLocaleString()} pcs/day</span>
            <span>·</span>
            <span>Total Factory Headcount: {totalPlantHeadcount} MP</span>
            <span>·</span>
            <span>Active: {activeLine.toUpperCase()}</span>
          </div>
        </div>
      </footer>

      {/* Printable Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        stations={currentStations}
        idlList={currentIdl}
        sparesList={currentSpares}
        config={currentConfig}
        metrics={currentMetrics}
        onExportCSV={handleExportCSV}
      />
    </div>
  );
}
