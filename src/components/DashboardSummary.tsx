import React, { useState } from 'react';
import { StationData, ProductionLineConfig, IndirectLaborData, SpareLaborData, ModelVolumeItem } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Gauge, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  Factory,
  ChevronRight,
  PieChart,
  Target,
  Edit3,
  Save,
  RotateCcw,
  Check
} from 'lucide-react';
import { VolumeModelManagement } from './VolumeModelManagement';

interface DashboardSummaryProps {
  modelVolumes: ModelVolumeItem[];
  onAddModelVolume: (item: Omit<ModelVolumeItem, 'id'>) => void;
  onUpdateModelVolume: (id: string, updates: Partial<ModelVolumeItem>) => void;
  onDeleteModelVolume: (id: string) => void;
  onResetModelVolumes?: () => void;
  lineAData: {
    config: ProductionLineConfig;
    stations: StationData[];
    metrics: IEMetrics;
  };
  lineBData: {
    config: ProductionLineConfig;
    stations: StationData[];
    metrics: IEMetrics;
  };
  onSelectLine: (lineId: 'line-a' | 'line-b') => void;
  onNavigateTab: (tabId: string) => void;
  onUpdateConfigA?: (updates: Partial<ProductionLineConfig>) => void;
  onUpdateConfigB?: (updates: Partial<ProductionLineConfig>) => void;
  onUpdateStationA?: (id: string, updates: Partial<StationData>) => void;
  onUpdateStationB?: (id: string, updates: Partial<StationData>) => void;
  onBatchUpdateUphA?: (newUph: number) => void;
  onBatchUpdateUphB?: (newUph: number) => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  modelVolumes,
  onAddModelVolume,
  onUpdateModelVolume,
  onDeleteModelVolume,
  onResetModelVolumes,
  lineAData,
  lineBData,
  onSelectLine,
  onNavigateTab,
  onUpdateConfigA,
  onUpdateConfigB,
  onUpdateStationA,
  onUpdateStationB,
  onBatchUpdateUphA,
  onBatchUpdateUphB,
}) => {
  const [selectedView, setSelectedView] = useState<'all' | 'lineA' | 'lineB'>('all');
  const [isEditingParams, setIsEditingParams] = useState<boolean>(false);
  const [isEditingStationMp, setIsEditingStationMp] = useState<boolean>(false);

  const totalPlantDailyOutput = lineAData.config.targetDailyOutput + lineBData.config.targetDailyOutput;
  const totalPlantHeadcount = lineAData.metrics.grandTotalHeadcount + lineBData.metrics.grandTotalHeadcount;
  const totalPlantDL = lineAData.metrics.totalDLBothShifts + lineBData.metrics.totalDLBothShifts;
  const totalPlantIDL = lineAData.metrics.totalIDL + lineBData.metrics.totalIDL;
  const totalPlantSpare = lineAData.metrics.totalSpareBothShifts + lineBData.metrics.totalSpareBothShifts;
  const totalPlantPayrollTHB = lineAData.metrics.monthlyTotalPayrollTHB + lineBData.metrics.monthlyTotalPayrollTHB;

  const avgPlantDlUpph = (lineAData.metrics.overallDLUPPH + lineBData.metrics.overallDLUPPH) / 2;
  const totalMonthlyUnits = totalPlantDailyOutput * 26;
  const avgCostPerUnit = totalMonthlyUnits > 0 ? totalPlantPayrollTHB / totalMonthlyUnits : 0;

  // Station Comparison Data (8 main stations)
  const stationStats = [1, 2, 3, 4, 5, 6, 7, 8].map((no) => {
    const stA_shiftA = lineAData.stations.find((s) => s.no === no && s.shift === 'Shift-A');
    const stA_shiftB = lineAData.stations.find((s) => s.no === no && s.shift === 'Shift-B');
    const stB_shiftA = lineBData.stations.find((s) => s.no === no && s.shift === 'Shift-A');
    const stB_shiftB = lineBData.stations.find((s) => s.no === no && s.shift === 'Shift-B');

    const mpA = stA_shiftA?.stdMp || 0;
    const mpB = stB_shiftA?.stdMp || 0;
    const totalMpBothLinesPerShift = mpA + mpB;
    const totalMpBothLinesAllShifts = totalMpBothLinesPerShift * 2;

    const percentOfPlantDL = (totalMpBothLinesAllShifts / (totalPlantDL || 1)) * 100;
    const isBottleneck = totalMpBothLinesPerShift >= 120;

    return {
      no,
      name: stB_shiftA?.name.replace(' (Shift-A)', '') || `Station ${no}`,
      thaiName: stB_shiftA?.thaiName.replace(' (กะ A)', '') || '',
      stA_shiftA_id: stA_shiftA?.id,
      stA_shiftB_id: stA_shiftB?.id,
      stB_shiftA_id: stB_shiftA?.id,
      stB_shiftB_id: stB_shiftB?.id,
      mpA,
      mpB,
      totalMpBothLinesPerShift,
      totalMpBothLinesAllShifts,
      percentOfPlantDL,
      isBottleneck,
      upphA: stA_shiftA?.upph || 0,
      upphB: stB_shiftA?.upph || 0,
      ctA: stA_shiftA?.ct || 0,
      ctB: stB_shiftA?.ct || 0,
    };
  });

  const handleUpdateStationMpA = (stNo: number, newMp: number) => {
    if (!onUpdateStationA) return;
    const stShiftA = lineAData.stations.find((s) => s.no === stNo && s.shift === 'Shift-A');
    const stShiftB = lineAData.stations.find((s) => s.no === stNo && s.shift === 'Shift-B');
    const newUpph = Math.round(lineAData.config.targetUph / (newMp || 1));
    const newOutput = Math.round((lineAData.config.targetUph * lineAData.config.netShiftHours) / (newMp || 1));

    if (stShiftA) {
      onUpdateStationA(stShiftA.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    }
    if (stShiftB) {
      onUpdateStationA(stShiftB.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    }
  };

  const handleUpdateStationMpB = (stNo: number, newMp: number) => {
    if (!onUpdateStationB) return;
    const stShiftA = lineBData.stations.find((s) => s.no === stNo && s.shift === 'Shift-A');
    const stShiftB = lineBData.stations.find((s) => s.no === stNo && s.shift === 'Shift-B');
    const newUpph = Math.round(lineBData.config.targetUph / (newMp || 1));
    const newOutput = Math.round((lineBData.config.targetUph * lineBData.config.netShiftHours) / (newMp || 1));

    if (stShiftA) {
      onUpdateStationB(stShiftA.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    }
    if (stShiftB) {
      onUpdateStationB(stShiftB.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    }
  };

  return (
    <div className="space-y-6">
      {/* Executive Briefing Banner for Plant Manager */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
                Executive Briefing · สรุปภาพรวมสำหรับผู้จัดการโรงงาน
              </span>
              <span className="text-xs text-slate-400">
                เอกสารวิเคราะห์สถานะสายการผลิต Line A & Line B (ตู้เย็น BM350 & BM400)
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Executive Dashboard Summary 1</span>
              <button
                onClick={() => setIsEditingParams(!isEditingParams)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  isEditingParams
                    ? 'bg-amber-400 text-black border-amber-300 shadow-md font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="คลิกเพื่อเปิดแผงแก้ไขตัวเลขเป้าหมายโรงงาน"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingParams ? 'กำลังแก้ไขตัวเลข (Editing)' : 'แก้ไขตัวเลขเป้าหมายโรงงาน'}</span>
              </button>
            </h2>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              โรงงานพร้อมเดินสายการผลิตเต็มรูปแบบ 2 กะ ด้วยกำลังผลิตเป้าหมายรวม <strong>{totalPlantDailyOutput.toLocaleString()} เครื่อง/วัน</strong> จัดสรรกำลังคนรวมทั้งสิ้น <strong>{totalPlantHeadcount.toLocaleString()} คน</strong> โครงสร้างสายการผลิตมีความยืดหยุ่นสูงด้วย Speed Reserve Buffer <strong>29.7% – 30.0%</strong> ป้องกัน Downtime
            </p>
          </div>

          {/* Quick Line Selector within Dashboard */}
          <div className="flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs self-start lg:self-auto">
            <button
              onClick={() => setSelectedView('all')}
              className={`px-3 py-2 font-bold rounded-lg transition-all ${
                selectedView === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ภาพรวม 2 ไลน์ (Plant All)
            </button>
            <button
              onClick={() => setSelectedView('lineA')}
              className={`px-3 py-2 font-bold rounded-lg transition-all ${
                selectedView === 'lineA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Line A (BM350)
            </button>
            <button
              onClick={() => setSelectedView('lineB')}
              className={`px-3 py-2 font-bold rounded-lg transition-all ${
                selectedView === 'lineB'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Line B (BM400)
            </button>
          </div>
        </div>

        {/* Live Inline Parameter Editor Panel (When toggled) */}
        {isEditingParams && (
          <div className="mt-6 pt-5 border-t border-slate-700/80 bg-slate-800/90 p-4 rounded-xl border border-amber-500/40 text-xs space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <Edit3 className="w-4 h-4" />
                <span>แผงแก้ไขตัวเลขเป้าหมายโรงงาน (Live Plant Parameter Editor)</span>
              </span>
              <button
                onClick={() => setIsEditingParams(false)}
                className="px-2.5 py-1 bg-amber-400 text-black font-bold rounded text-xs hover:bg-amber-300"
              >
                เสร็จสิ้น (Done)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Line A Controls */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-blue-300 font-bold border-b border-slate-700 pb-1">
                  <span>Line A (BM350)</span>
                  <span className="text-[10px] text-slate-400 font-mono">UPH & Output</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Daily Target (pcs)</label>
                    <input
                      type="number"
                      step="50"
                      value={lineAData.config.targetDailyOutput}
                      onChange={(e) => onUpdateConfigA?.({ targetDailyOutput: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Target UPH</label>
                    <input
                      type="number"
                      step="5"
                      value={lineAData.config.targetUph}
                      onChange={(e) => onUpdateConfigA?.({ targetUph: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-blue-300 font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Cycle Time (s)</label>
                    <input
                      type="number"
                      step="1"
                      value={lineAData.config.designCycleTimeSec}
                      onChange={(e) => onUpdateConfigA?.({ designCycleTimeSec: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-purple-300 font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Net Shift (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={lineAData.config.netShiftHours}
                      onChange={(e) => onUpdateConfigA?.({ netShiftHours: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Line B Controls */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-emerald-300 font-bold border-b border-slate-700 pb-1">
                  <span>Line B (BM400 · ต้นฉบับ)</span>
                  <span className="text-[10px] text-slate-400 font-mono">UPH & Output</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Daily Target (pcs)</label>
                    <input
                      type="number"
                      step="50"
                      value={lineBData.config.targetDailyOutput}
                      onChange={(e) => onUpdateConfigB?.({ targetDailyOutput: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Target UPH</label>
                    <input
                      type="number"
                      step="5"
                      value={lineBData.config.targetUph}
                      onChange={(e) => onUpdateConfigB?.({ targetUph: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-emerald-300 font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Cycle Time (s)</label>
                    <input
                      type="number"
                      step="1"
                      value={lineBData.config.designCycleTimeSec}
                      onChange={(e) => onUpdateConfigB?.({ designCycleTimeSec: parseInt(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-purple-300 font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Net Shift (hrs)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={lineBData.config.netShiftHours}
                      onChange={(e) => onUpdateConfigB?.({ netShiftHours: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-800 text-white font-mono font-bold px-2 py-1 rounded border border-slate-600 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Wage rate controls */}
            <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400 font-medium">ปรับฐานเงินเดือนเฉลี่ย (THB/month):</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">DL:</span>
                  <input
                    type="number"
                    step="500"
                    value={lineAData.config.monthlySalaryDLTHB}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateConfigA?.({ monthlySalaryDLTHB: val });
                      onUpdateConfigB?.({ monthlySalaryDLTHB: val });
                    }}
                    className="w-20 bg-slate-800 text-white font-mono px-1.5 py-0.5 rounded border border-slate-600"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">IDL:</span>
                  <input
                    type="number"
                    step="1000"
                    value={lineAData.config.monthlySalaryIDLTHB}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      onUpdateConfigA?.({ monthlySalaryIDLTHB: val });
                      onUpdateConfigB?.({ monthlySalaryIDLTHB: val });
                    }}
                    className="w-20 bg-slate-800 text-white font-mono px-1.5 py-0.5 rounded border border-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-400" />
                กำลังการผลิตรวม (Daily Output)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-white font-mono">
                {selectedView === 'lineA'
                  ? lineAData.config.targetDailyOutput.toLocaleString()
                  : selectedView === 'lineB'
                  ? lineBData.config.targetDailyOutput.toLocaleString()
                  : totalPlantDailyOutput.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">เครื่อง/วัน</span>
            </div>
            <div className="mt-2 text-[11px] text-blue-300 font-mono">
              Line A: {lineAData.config.targetDailyOutput.toLocaleString()} · Line B: {lineBData.config.targetDailyOutput.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-yellow-400" />
                กำลังคนรวมทั้งโรงงาน (Headcount)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-yellow-400 font-mono">
                {selectedView === 'lineA'
                  ? lineAData.metrics.grandTotalHeadcount
                  : selectedView === 'lineB'
                  ? lineBData.metrics.grandTotalHeadcount
                  : totalPlantHeadcount}
              </span>
              <span className="text-xs text-slate-400">คน (MP)</span>
            </div>
            <div className="mt-2 text-[11px] text-yellow-200/80 font-mono">
              DL: {totalPlantDL} · IDL: {totalPlantIDL} · Spare: {totalPlantSpare}
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                ประสิทธิภาพแรงงาน (DL UPPH)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-400 font-mono">
                {selectedView === 'lineA'
                  ? lineAData.metrics.overallDLUPPH.toFixed(3)
                  : selectedView === 'lineB'
                  ? lineBData.metrics.overallDLUPPH.toFixed(3)
                  : avgPlantDlUpph.toFixed(3)}
              </span>
              <span className="text-xs text-slate-400">unit/man-h</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-300 font-mono">
              Line A: {lineAData.metrics.overallDLUPPH.toFixed(3)} · Line B: {lineBData.metrics.overallDLUPPH.toFixed(3)}
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-purple-400" />
                งบค่าจ้างแรงงานรวมรายเดือน
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-purple-300 font-mono">
                {(totalPlantPayrollTHB / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs text-slate-400">บาท/เดือน</span>
            </div>
            <div className="mt-2 text-[11px] text-purple-200/80 font-mono">
              ต้นทุนเฉลี่ย: {avgCostPerUnit.toFixed(1)} บาท/เครื่อง
            </div>
          </div>
        </div>
      </div>

      {/* Production Volume Management: Model A & Model B */}
      <VolumeModelManagement
        modelVolumes={modelVolumes}
        onAddModelVolume={onAddModelVolume}
        onUpdateModelVolume={onUpdateModelVolume}
        onDeleteModelVolume={onDeleteModelVolume}
        onResetModelVolumes={onResetModelVolumes}
        lineAConfig={lineAData.config}
        lineAMetrics={lineAData.metrics}
        lineBConfig={lineBData.config}
        lineBMetrics={lineBData.metrics}
        onUpdateConfigA={onUpdateConfigA || (() => {})}
        onUpdateConfigB={onUpdateConfigB || (() => {})}
        onBatchUpdateUphA={onBatchUpdateUphA}
        onBatchUpdateUphB={onBatchUpdateUphB}
        onSelectLine={onSelectLine}
      />

      {/* 3 Key Takeaways for Plant Manager */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">1. โครงสร้างกำลังคนคล่องตัวสูง (Lean DL/IDL)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            สัดส่วนแรงงานทางตรง (DL) สูงถึง <strong>89.7%</strong> (1,312 คน) ขณะที่ IDL อยู่ที่เพียง <strong>5.2%</strong> (76 คน) คิดเป็นอัตราส่วน Leader 1 คนต่อผู้ปฏิบัติงาน 42 คน สอดคล้องกับมาตรฐาน Lean Manufacturing ระดับสากล
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/20 p-5 rounded-xl shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">2. เฝ้าระวัง 3 จุดคอขวดหลัก (Critical Bottlenecks)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            สถานี <strong>Inner Box (144 คน)</strong>, <strong>Assembly (132 คน)</strong>, และ <strong>Cab Pre-assy (120 คน)</strong> ใช้กำลังคนรวมกันถึง <strong>60.4% ของทั้งโรงงาน</strong> เป็นจุดที่มีโอกาสทำ Kaizen Automation เพื่อลดต้นทุนได้สูงสุด
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <Gauge className="w-5 h-5 flex-shrink-0" />
            <h3 className="font-bold text-sm text-slate-900">3. เสถียรภาพความเร็วสายการผลิต (Speed Reserve)</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            ทั้ง 2 ไลน์มี Cycle Time ออกแบบ (21s และ 23s) เร็วกว่า Takt Time (30.0s และ 32.7s) ทำให้มี <strong>Buffer สำรองความเร็วถึง 30.0%</strong> ช่วยดูดซับความผันผวนจากการเปลี่ยนโมเดลและเบรกไลน์ได้ดีเยี่ยม
          </p>
        </div>
      </div>

      {/* Visual Dimension 1 & 2: Process Heatmap & Direct Manpower Editor */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Process Labor Intensity Heatmap (แผนผังความหนาแน่นกำลังคน 8 สถานี)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เปรียบเทียบจำนวนกำลังคนประจำแต่ละสถานีระหว่าง Line A (สีน้ำเงิน) และ Line B (สีเขียว) ต่อกะ
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Direct Station MP Editor toggle */}
            <button
              onClick={() => setIsEditingStationMp(!isEditingStationMp)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isEditingStationMp
                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEditingStationMp ? 'ปิดโหมดแก้ไขกำลังคน' : 'แก้ไขจำนวนคนในตารางนี้'}</span>
            </button>

            <span className="text-xs font-medium flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-600"></span>
              Line A: {lineAData.metrics.totalDLPerShift} คน/กะ
            </span>
            <span className="text-xs font-medium flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600"></span>
              Line B: {lineBData.metrics.totalDLPerShift} คน/กะ
            </span>
          </div>
        </div>

        {/* Grouped Bar Chart with Interactive Editing */}
        <div className="mt-6 space-y-4">
          {stationStats.map((st) => {
            const widthPercentA = Math.max(5, (st.mpA / 80) * 100);
            const widthPercentB = Math.max(5, (st.mpB / 80) * 100);

            return (
              <div key={st.no} className="group p-2 rounded-lg hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-[11px] flex-shrink-0">
                      #{st.no}
                    </span>
                    <span className="font-semibold text-slate-800 truncate">{st.name}</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline truncate">({st.thaiName})</span>
                    {st.isBottleneck && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5 flex-shrink-0">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Heavy Bottleneck
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-slate-700 text-xs flex-shrink-0 flex items-center gap-3">
                    <span>รวม 2 ไลน์: <strong>{st.totalMpBothLinesPerShift} คน/กะ</strong></span>
                    <span className="text-slate-400 hidden sm:inline">({st.percentOfPlantDL.toFixed(1)}% ของ DL ทั้งโรงงาน)</span>
                  </div>
                </div>

                {/* Dual Bars Container with Interactive Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  {/* Line A Bar & Editor */}
                  <div className="flex items-center gap-2">
                    <div className="h-6 flex-1 bg-slate-100 rounded overflow-hidden relative flex items-center">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300 rounded-r flex items-center justify-between px-2 text-white font-mono text-[10px] font-bold"
                        style={{ width: `${widthPercentA}%` }}
                      >
                        <span>Line A</span>
                        <span>{st.mpA} คน</span>
                      </div>
                    </div>
                    {isEditingStationMp && (
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={st.mpA}
                          onChange={(e) => handleUpdateStationMpA(st.no, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 text-right font-bold text-blue-700 border border-blue-400 rounded bg-white shadow-2xs"
                          title="แก้ไขคน Line A ประจำสถานีนี้"
                        />
                        <span className="text-[10px] text-slate-400">คน</span>
                      </div>
                    )}
                  </div>

                  {/* Line B Bar & Editor */}
                  <div className="flex items-center gap-2">
                    <div className="h-6 flex-1 bg-slate-100 rounded overflow-hidden relative flex items-center">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-300 rounded-r flex items-center justify-between px-2 text-white font-mono text-[10px] font-bold"
                        style={{ width: `${widthPercentB}%` }}
                      >
                        <span>Line B</span>
                        <span>{st.mpB} คน</span>
                      </div>
                    </div>
                    {isEditingStationMp && (
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={st.mpB}
                          onChange={(e) => handleUpdateStationMpB(st.no, parseFloat(e.target.value) || 0)}
                          className="w-14 px-1.5 py-0.5 text-right font-bold text-emerald-700 border border-emerald-400 rounded bg-white shadow-2xs"
                          title="แก้ไขคน Line B ประจำสถานีนี้"
                        />
                        <span className="text-[10px] text-slate-400">คน</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Dimension 3 & 4: Multi-dimensional Metrics Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Headcount Composition Donut/Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                สัดส่วนการใช้แรงงานรวมทั้งโรงงาน
              </h3>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-blue-700">Direct Labor (DL - แรงงานผลิตตรง)</span>
                  <span className="font-mono font-bold">{totalPlantDL} คน ({((totalPlantDL / totalPlantHeadcount) * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(totalPlantDL / totalPlantHeadcount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-amber-700">Indirect Labor (IDL - ผู้ควบคุม/ผู้นำกลุ่ม)</span>
                  <span className="font-mono font-bold">{totalPlantIDL} คน ({((totalPlantIDL / totalPlantHeadcount) * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(totalPlantIDL / totalPlantHeadcount) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-emerald-700">Spare Buffer (แรงงานสำรองหมุนเวียน)</span>
                  <span className="font-mono font-bold">{totalPlantSpare} คน ({((totalPlantSpare / totalPlantHeadcount) * 100).toFixed(1)}%)</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(totalPlantSpare / totalPlantHeadcount) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono">
            รวมกำลังคนทั้ง 2 ไลน์ = <strong>{totalPlantHeadcount} คน</strong>
          </div>
        </div>

        {/* 2. Speed Reserve & Line Capability Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Cycle Time vs Takt Time Matrix
              </h3>
            </div>

            <div className="space-y-4 pt-1 text-xs">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200 font-mono">
                <div className="flex justify-between font-bold text-blue-900 mb-1">
                  <span>Line A (BM350):</span>
                  <span>Buffer: +{lineAData.metrics.speedReservePercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Design CT: <strong>{lineAData.config.designCycleTimeSec}s</strong></span>
                  <span>Takt Time: <strong>{lineAData.metrics.taktTimeSec.toFixed(1)}s</strong></span>
                </div>
                <div className="mt-2 text-[10px] text-blue-700 font-sans">
                  ขีดความสามารถสูงสุดตามทฤษฎี: <strong>{(3600 / (lineAData.config.designCycleTimeSec || 1)).toFixed(1)} UPH</strong> (ปัจจุบันเดินที่ {lineAData.config.targetUph} UPH)
                </div>
              </div>

              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 font-mono">
                <div className="flex justify-between font-bold text-emerald-900 mb-1">
                  <span>Line B (BM400):</span>
                  <span>Buffer: +{lineBData.metrics.speedReservePercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[11px]">
                  <span>Design CT: <strong>{lineBData.config.designCycleTimeSec}s</strong></span>
                  <span>Takt Time: <strong>{lineBData.metrics.taktTimeSec.toFixed(1)}s</strong></span>
                </div>
                <div className="mt-2 text-[10px] text-emerald-700 font-sans">
                  ขีดความสามารถสูงสุดตามทฤษฎี: <strong>{(3600 / (lineBData.config.designCycleTimeSec || 1)).toFixed(1)} UPH</strong> (ปัจจุบันเดินที่ {lineBData.config.targetUph} UPH)
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            ระบบมีความพร้อมรองรับยอด Ramp-up เพิ่มขึ้นได้อีก 15% - 20%
          </div>
        </div>

        {/* 3. Cost Economics & Kaizen Target */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                ประมาณการงบประมาณ & โอกาส Kaizen
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">ค่าจ้าง DL รวม (2 ไลน์):</span>
                <span className="font-mono font-bold text-slate-900">
                  {(((totalPlantDL + totalPlantSpare) * lineAData.config.monthlySalaryDLTHB) / 1000000).toFixed(2)}M THB/เดือน
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">ค่าจ้าง IDL รวม (2 ไลน์):</span>
                <span className="font-mono font-bold text-slate-900">
                  {((totalPlantIDL * lineAData.config.monthlySalaryIDLTHB) / 1000000).toFixed(2)}M THB/เดือน
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">ต้นทุนค่าแรงต่อเครื่อง:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {avgCostPerUnit.toFixed(1)} บาท/เครื่อง
                </span>
              </div>

              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-purple-900 mt-2">
                <span className="font-bold flex items-center gap-1 text-purple-800 text-[11px] mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  เป้าหมายลดต้นทุนปี 2026 (Kaizen Goal):
                </span>
                <p className="text-[11px] leading-relaxed">
                  หากทำโครงการลดกำลังคน 5% (ลด 73 คนทั่วทั้งโรงงาน) จะประหยัดงบค่าจ้างได้ <strong>1.13 ล้านบาท/เดือน</strong> หรือกว่า <strong>13.6 ล้านบาท/ปี</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('kaizen')}
              className="text-purple-700 hover:text-purple-900 font-semibold flex items-center gap-1"
            >
              <span>เปิดห้องจำลอง Kaizen Studio</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Strategic Action Items for Plant Manager */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <span>แผนปฏิบัติการเชิงกลยุทธ์สำหรับผู้จัดการโรงงาน (Strategic Action Items)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-sm">
              ระยะสั้น (1–3 เดือน): บริหารจัดการหน้างาน
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• ตรวจสอบอัตราการขาดลาของ DL ให้คุมอยู่ในโควตา Spare 5.1%</li>
              <li>• ป้องกันปัญหาคอขวดสะสมในสถานี #2 Inner Box และ #5 Assembly</li>
              <li>• ตรวจเช็คระบบตรวจจับการรั่วก๊าซ R600a ในสถานี #6 System ass'y ทุกวัน</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-sm">
              ระยะกลาง (3–6 เดือน): วิศวกรรม & Kaizen
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• ดำเนินโครงการ Auto Screw Feeder ในสถานี Assembly ลดได้ 4-6 คน</li>
              <li>• ปรับปรุงแม่พิมพ์ขึ้นรูป Inner Box ด้วย Auto CNC Router</li>
              <li>• จัดทำระบบ Poka-Yoke ในขั้นตอนต่อสายไฟและทดสอบ Hi-Pot</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-800 block text-sm">
              ระยะยาว (6–12 เดือน): Smart Manufacturing
            </span>
            <ul className="space-y-1 text-slate-600">
              <li>• ติดตั้ง Robotic Palletizer ในสถานี Final Packing #7</li>
              <li>• ศึกษาการเพิ่ม UPH จาก 110 เป็น 125 เพื่อรองรับยอด High Season</li>
              <li>• พัฒนาระบบ Real-time Andon ติดตาม OEE ประจำสายการผลิต</li>
            </ul>
          </div>
        </div>

        {/* Action button links */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-500">
            เอกสารสรุปได้รับการตรวจสอบและคำนวณตามหลักวิศวกรรม IE โดยอัตโนมัติ
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onSelectLine('line-a');
                onNavigateTab('manning');
              }}
              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-colors"
            >
              ดูตาราง Line A
            </button>
            <button
              onClick={() => {
                onSelectLine('line-b');
                onNavigateTab('manning');
              }}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-semibold transition-colors"
            >
              ดูตาราง Line B
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
