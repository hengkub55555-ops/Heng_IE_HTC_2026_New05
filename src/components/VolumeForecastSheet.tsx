import React, { useState, useMemo } from 'react';
import { ModelVolumeItem, ProductionLineConfig, StationData } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import {
  TrendingUp,
  Clock,
  Users,
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  DollarSign,
  PieChart,
  FileSpreadsheet,
  Download,
  Info,
  RefreshCw,
  Zap,
  Target,
  ArrowRight,
  Layers,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Tag
} from 'lucide-react';

interface VolumeForecastSheetProps {
  modelVolumes: ModelVolumeItem[];
  onAddModelVolume?: (item: Omit<ModelVolumeItem, 'id'>) => void;
  onUpdateModelVolume: (id: string, updates: Partial<ModelVolumeItem>) => void;
  onDeleteModelVolume?: (id: string) => void;
  lineAConfig: ProductionLineConfig;
  lineAMetrics: IEMetrics;
  lineBConfig: ProductionLineConfig;
  lineBMetrics: IEMetrics;
  stationsA: StationData[];
  stationsB: StationData[];
  onBatchUpdateUphA?: (newUph: number) => void;
  onBatchUpdateUphB?: (newUph: number) => void;
  onNavigateTab?: (tabId: string) => void;
}

export const VolumeForecastSheet: React.FC<VolumeForecastSheetProps> = ({
  modelVolumes,
  onAddModelVolume,
  onUpdateModelVolume,
  onDeleteModelVolume,
  lineAConfig,
  lineAMetrics,
  lineBConfig,
  lineBMetrics,
  stationsA,
  stationsB,
  onBatchUpdateUphA,
  onBatchUpdateUphB,
  onNavigateTab,
}) => {
  // Global simulation parameters
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState<number>(26);
  const [shiftsPerDay, setShiftsPerDay] = useState<number>(2);
  const [netHoursPerShift, setNetHoursPerShift] = useState<number>(10.5);
  const [globalOee, setGlobalOee] = useState<number>(90); // 90%
  const [idlRatioPercent, setIdlRatioPercent] = useState<number>(5.5); // % of DL
  const [spareRatioPercent, setSpareRatioPercent] = useState<number>(4.6); // % of DL
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editBuffer, setEditBuffer] = useState<Partial<ModelVolumeItem>>({});
  const [viewFilter, setViewFilter] = useState<'all' | 'line-a' | 'line-b'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [notice, setNotice] = useState<string | null>(null);

  // New Model State
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelCode, setNewModelCode] = useState<string>('');
  const [newModelLine, setNewModelLine] = useState<'line-a' | 'line-b'>('line-b');
  const [newModelVolume, setNewModelVolume] = useState<number>(600);
  const [newModelCt, setNewModelCt] = useState<number>(22);
  const [newModelWc, setNewModelWc] = useState<number>(1600);
  const [newModelMonth, setNewModelMonth] = useState<string>('ตุลาคม 2026');
  const [newModelMarket, setNewModelMarket] = useState<string>('ตลาดส่งออก (Export)');
  const [newModelStatus, setNewModelStatus] = useState<'Active' | 'Planned' | 'Ramp-up' | 'Phase-out'>('Active');
  const [newModelDesc, setNewModelDesc] = useState<string>('');

  const triggerNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Baseline Work Content from stations
  const baselineWorkContentA = stationsA
    .filter((s) => s.shift === 'Shift-A')
    .reduce((sum, s) => sum + s.ct, 0) || 1542;

  const baselineWorkContentB = stationsB
    .filter((s) => s.shift === 'Shift-A')
    .reduce((sum, s) => sum + s.ct, 0) || 1680;

  // Accurate Forecast Calculation for each Model
  const forecastRows = useMemo(() => {
    const totalDailyVolume = modelVolumes.reduce((s, m) => s + (Number(m.dailyVolume) || 0), 0);
    const netDailyOperatingSeconds = shiftsPerDay * netHoursPerShift * 3600; // e.g. 2 * 10.5 * 3600 = 75,600s

    return modelVolumes.map((model) => {
      const isLineA = model.line === 'line-a';
      const lineConfig = isLineA ? lineAConfig : lineBConfig;
      const defaultCt = isLineA ? lineAConfig.designCycleTimeSec : lineBConfig.designCycleTimeSec;
      const defaultWc = isLineA ? baselineWorkContentA : baselineWorkContentB;

      const dailyVol = Number(model.dailyVolume) || 0;
      const monthlyVol = dailyVol * workingDaysPerMonth;
      const annualVol = monthlyVol * 12;
      const shiftVol = shiftsPerDay > 0 ? Math.round(dailyVol / shiftsPerDay) : dailyVol;
      const mixShare = totalDailyVolume > 0 ? (dailyVol / totalDailyVolume) * 100 : 0;

      // 1. Takt Time (TT) = Available Net Operating Time per Day / Daily Customer Demand (Volume)
      const modelOee = model.oeePercent || globalOee;
      const effectiveDailyOperatingSeconds = netDailyOperatingSeconds * (modelOee / 100);
      const taktTimeSec = dailyVol > 0 ? effectiveDailyOperatingSeconds / dailyVol : 0;

      // 2. Cycle Time (CT) = Model-specific machine/conveyor line speed cycle time
      const cycleTimeSec = model.modelCycleTimeSec || defaultCt;

      // 3. Work Content Time (Total manual labor seconds required to assemble 1 unit)
      const workContentSec = model.workContentSec || defaultWc;
      const workContentMin = workContentSec / 60;

      // 4. Theoretical Headcount DL Required = Total Work Content / Takt Time
      const theoreticalDlTotal = taktTimeSec > 0 ? (workContentSec / taktTimeSec) : 0;
      const theoreticalDlPerShift = Math.ceil(theoreticalDlTotal / shiftsPerDay);
      const theoreticalDlBothShifts = theoreticalDlPerShift * shiftsPerDay;

      // 5. Line Balance Efficiency & Line Speed (UPH)
      const netWorkingHoursPerDay = shiftsPerDay * netHoursPerShift;
      const requiredUph = netWorkingHoursPerDay > 0 ? Math.ceil(dailyVol / (netWorkingHoursPerDay * (modelOee / 100))) : 0;
      
      // Speed Reserve / Capacity buffer (%)
      const speedBufferPercent = taktTimeSec > 0 ? ((taktTimeSec - cycleTimeSec) / taktTimeSec) * 100 : 0;

      // 6. IDL & Spare Staffing Forecast
      const modelSparePercent = model.spareMpBufferPercent || spareRatioPercent;
      const forecastedSpareBothShifts = Math.round(theoreticalDlBothShifts * (modelSparePercent / 100));
      const forecastedIdl = Math.round(theoreticalDlBothShifts * (idlRatioPercent / 100));
      const grandTotalHeadcount = theoreticalDlBothShifts + forecastedSpareBothShifts + forecastedIdl;

      // 7. UPPH Forecast (Units per Person-Hour)
      const totalManHoursPerDay = theoreticalDlBothShifts * netHoursPerShift;
      const dlUpph = totalManHoursPerDay > 0 ? dailyVol / totalManHoursPerDay : 0;
      const totalUpph = (grandTotalHeadcount * netHoursPerShift) > 0 ? dailyVol / (grandTotalHeadcount * netHoursPerShift) : 0;

      // 8. Labor Cost Forecast (THB)
      const monthlyWageDL = lineConfig.monthlySalaryDLTHB || 15500;
      const monthlyWageIDL = lineConfig.monthlySalaryIDLTHB || 28000;
      const monthlyPayrollTHB = ((theoreticalDlBothShifts + forecastedSpareBothShifts) * monthlyWageDL) + (forecastedIdl * monthlyWageIDL);
      const laborCostPerUnit = monthlyVol > 0 ? monthlyPayrollTHB / monthlyVol : 0;

      return {
        ...model,
        dailyVol,
        monthlyVol,
        annualVol,
        shiftVol,
        mixShare,
        modelOee,
        taktTimeSec,
        cycleTimeSec,
        workContentSec,
        workContentMin,
        speedBufferPercent,
        requiredUph,
        theoreticalDlPerShift,
        theoreticalDlBothShifts,
        forecastedSpareBothShifts,
        forecastedIdl,
        grandTotalHeadcount,
        dlUpph,
        totalUpph,
        monthlyPayrollTHB,
        laborCostPerUnit,
        lineName: lineConfig.lineName,
        lineShortCode: lineConfig.lineShortCode,
      };
    });
  }, [
    modelVolumes,
    workingDaysPerMonth,
    shiftsPerDay,
    netHoursPerShift,
    globalOee,
    idlRatioPercent,
    spareRatioPercent,
    lineAConfig,
    lineBConfig,
    baselineWorkContentA,
    baselineWorkContentB,
  ]);

  // Aggregate summary
  const summary = useMemo(() => {
    const totalDaily = forecastRows.reduce((s, r) => s + r.dailyVol, 0);
    const totalMonthly = forecastRows.reduce((s, r) => s + r.monthlyVol, 0);
    const totalAnnual = forecastRows.reduce((s, r) => s + r.annualVol, 0);
    const totalDL = forecastRows.reduce((s, r) => s + r.theoreticalDlBothShifts, 0);
    const totalIDL = forecastRows.reduce((s, r) => s + r.forecastedIdl, 0);
    const totalSpare = forecastRows.reduce((s, r) => s + r.forecastedSpareBothShifts, 0);
    const totalHeadcount = totalDL + totalIDL + totalSpare;
    const totalPayroll = forecastRows.reduce((s, r) => s + r.monthlyPayrollTHB, 0);
    const avgCostPerUnit = totalMonthly > 0 ? totalPayroll / totalMonthly : 0;
    const avgDlUpph = forecastRows.length > 0 ? forecastRows.reduce((s, r) => s + r.dlUpph, 0) / forecastRows.length : 0;

    return {
      totalDaily,
      totalMonthly,
      totalAnnual,
      totalDL,
      totalIDL,
      totalSpare,
      totalHeadcount,
      totalPayroll,
      avgCostPerUnit,
      avgDlUpph,
    };
  }, [forecastRows]);

  const handleStartEdit = (row: typeof forecastRows[0]) => {
    setEditingModelId(row.id);
    setEditBuffer({
      name: row.name,
      modelCode: row.modelCode,
      line: row.line,
      dailyVolume: row.dailyVolume,
      modelCycleTimeSec: row.cycleTimeSec,
      workContentSec: row.workContentSec,
      oeePercent: row.modelOee,
      targetLotSize: row.targetLotSize,
      planMonth: row.planMonth,
      customerOrMarket: row.customerOrMarket,
      status: row.status,
      description: row.description,
    });
  };

  const handleSaveEdit = (id: string) => {
    if (editBuffer) {
      onUpdateModelVolume(id, {
        ...editBuffer,
        name: editBuffer.name?.trim() || undefined,
        modelCode: editBuffer.modelCode?.trim() || undefined,
        dailyVolume: Number(editBuffer.dailyVolume) || 0,
        modelCycleTimeSec: Number(editBuffer.modelCycleTimeSec) || undefined,
        workContentSec: Number(editBuffer.workContentSec) || undefined,
        oeePercent: Number(editBuffer.oeePercent) || undefined,
      });
      triggerNotice(`✓ บันทึกการแก้ไขชื่อและตัวเลขของ Model (${editBuffer.name || id}) เรียบร้อยแล้ว`);
    }
    setEditingModelId(null);
    setEditBuffer({});
  };

  const handleCancelEdit = () => {
    setEditingModelId(null);
    setEditBuffer({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || newModelVolume <= 0) return;

    if (onAddModelVolume) {
      onAddModelVolume({
        name: newModelName.trim(),
        modelCode: newModelCode.trim() || newModelName.trim().slice(0, 8).toUpperCase(),
        line: newModelLine,
        dailyVolume: Number(newModelVolume),
        modelCycleTimeSec: Number(newModelCt) || (newModelLine === 'line-a' ? 21 : 23),
        workContentSec: Number(newModelWc) || (newModelLine === 'line-a' ? 1542 : 1680),
        planMonth: newModelMonth || 'ตุลาคม 2026',
        customerOrMarket: newModelMarket || 'ตลาดในประเทศ',
        status: newModelStatus || 'Active',
        description: newModelDesc || `โมเดลคาดการณ์สำหรับ ${newModelLine === 'line-a' ? 'Line A' : 'Line B'}`,
        isMain: false,
      });

      triggerNotice(`✓ เพิ่มโมเดลใหม่ "${newModelName.trim()}" และคำนวณคาดการณ์ TT, CT, กำลังคนอัตโนมัติแล้ว`);
    }

    // Reset Form
    setNewModelName('');
    setNewModelCode('');
    setNewModelVolume(600);
    setNewModelDesc('');
    setShowAddModal(false);
  };

  const handleDeleteModel = (id: string, name: string) => {
    if (onDeleteModelVolume) {
      onDeleteModelVolume(id);
      triggerNotice(`✓ ลบโมเดล "${name}" ออกจาก Forecast และคำนวณใหม่แล้ว`);
    }
  };

  const handleExportForecastCSV = () => {
    const headers = [
      'Model Name',
      'Model Code',
      'Line',
      'Plan Month',
      'Market',
      'Status',
      'Daily Volume (pcs)',
      'Shift Volume (pcs)',
      'Monthly Volume (pcs)',
      'Annual Volume (pcs)',
      'Mix Share (%)',
      'Takt Time TT (sec)',
      'Cycle Time CT (sec)',
      'Work Content (sec)',
      'OEE (%)',
      'Req UPH',
      'DL Headcount (Shift)',
      'DL Headcount (Both)',
      'IDL Headcount',
      'Spare Buffer',
      'Total Headcount (MP)',
      'DL UPPH',
      'Cost Per Unit (THB)',
    ];

    const rows = forecastRows.map((r) => [
      `"${r.name}"`,
      `"${r.modelCode}"`,
      `"${r.lineShortCode}"`,
      `"${r.planMonth || ''}"`,
      `"${r.customerOrMarket || ''}"`,
      `"${r.status || 'Active'}"`,
      r.dailyVol,
      r.shiftVol,
      r.monthlyVol,
      r.annualVol,
      r.mixShare.toFixed(2),
      r.taktTimeSec.toFixed(2),
      r.cycleTimeSec,
      r.workContentSec,
      r.modelOee,
      r.requiredUph,
      r.theoreticalDlPerShift,
      r.theoreticalDlBothShifts,
      r.forecastedIdl,
      r.forecastedSpareBothShifts,
      r.grandTotalHeadcount,
      r.dlUpph.toFixed(3),
      r.laborCostPerUnit.toFixed(1),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Volume_Forecast_TT_CT_Model_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Sheet Volume Forecast by Model & Accurate Headcount Planning
                </h2>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  เพิ่ม/แก้ไขชื่อและตัวเลข Model ได้อิสระ พร้อมบันทึกอัตโนมัติ
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-4xl">
                ระบบคาดการณ์ปริมาณการผลิต (Volume Forecast) และการใช้อัตรากำลังคน (DL/IDL/Spare MP) พร้อมคำนวณเวลา Takt Time (TT), Cycle Time (CT), Work Content, ความเร็ว UPH และต้นทุนต่อเครื่องสำหรับแต่ละ Model โดยอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddModal(!showAddModal)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่ม Model ใน Forecast</span>
            </button>

            <button
              onClick={handleExportForecastCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Forecast CSV</span>
            </button>
          </div>
        </div>

        {/* Global Simulation Parameters Toolbar */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">วันทำงาน/เดือน (Days)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min="20"
                max="31"
                value={workingDaysPerMonth}
                onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 26)}
                className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">วัน/เดือน</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">จำนวนกะ/วัน (Shifts)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min="1"
                max="3"
                value={shiftsPerDay}
                onChange={(e) => setShiftsPerDay(Number(e.target.value) || 2)}
                className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">กะ/วัน</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ชม.สุทธิต่อกะ (Net Hrs)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                min="7"
                max="12"
                value={netHoursPerShift}
                onChange={(e) => setNetHoursPerShift(Number(e.target.value) || 10.5)}
                className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-white text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">ชม./กะ</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">สมมติฐาน OEE (%)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                min="60"
                max="100"
                value={globalOee}
                onChange={(e) => setGlobalOee(Number(e.target.value) || 90)}
                className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-emerald-400 text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">% OEE</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">IDL Ratio (% DL)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={idlRatioPercent}
                onChange={(e) => setIdlRatioPercent(Number(e.target.value) || 5.5)}
                className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-yellow-400 text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">%</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Spare Buffer (% DL)</span>
            <div className="flex items-center gap-1 mt-1">
              <input
                type="number"
                step="0.5"
                min="0"
                max="15"
                value={spareRatioPercent}
                onChange={(e) => setSpareRatioPercent(Number(e.target.value) || 4.6)}
                className="w-14 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-center font-mono font-bold text-cyan-400 text-xs outline-none"
              />
              <span className="text-[11px] text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Save Notice Toast */}
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{notice}</span>
          </div>
          <span className="text-[10px] text-emerald-600 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
            Auto-Saved
          </span>
        </div>
      )}

      {/* Add Model Drawer Form */}
      {showAddModal && (
        <form onSubmit={handleCreateSubmit} className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
            <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>เพิ่มโมเดลใหม่ใน Volume Forecast (Add New Model to Forecast)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อโมเดล (Model Name)*
              </label>
              <input
                type="text"
                required
                placeholder="เช่น Model C (BM500)"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                รหัสโมเดล (Model Code)*
              </label>
              <input
                type="text"
                placeholder="เช่น BM500"
                value={newModelCode}
                onChange={(e) => setNewModelCode(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สายการผลิตเป้าหมาย (Assigned Line)*
              </label>
              <select
                value={newModelLine}
                onChange={(e) => setNewModelLine(e.target.value as 'line-a' | 'line-b')}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-slate-800"
              >
                <option value="line-a">Line A (Model A · BM350)</option>
                <option value="line-b">Line B (Model B · BM400)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ยอดการผลิตต่อวัน (Daily Volume)*
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  required
                  min="1"
                  step="10"
                  value={newModelVolume}
                  onChange={(e) => setNewModelVolume(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-emerald-700"
                />
                <span className="text-xs text-slate-500">pcs</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cycle Time ของโมเดล (CT วินาที)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="60"
                value={newModelCt}
                onChange={(e) => setNewModelCt(Number(e.target.value) || 22)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Content ปริมาณงาน (วินาที)
              </label>
              <input
                type="number"
                step="10"
                min="100"
                value={newModelWc}
                onChange={(e) => setNewModelWc(Number(e.target.value) || 1600)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เดือนแผนผลิต (Plan Month)
              </label>
              <input
                type="text"
                value={newModelMonth}
                onChange={(e) => setNewModelMonth(e.target.value)}
                placeholder="เช่น ตุลาคม 2026"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตลาด / ลูกค้าเป้าหมาย (Market)
              </label>
              <input
                type="text"
                value={newModelMarket}
                onChange={(e) => setNewModelMarket(e.target.value)}
                placeholder="เช่น ส่งออก EU/Japan"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 pt-1">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำอธิบาย / สเปกสินค้า (Description)
              </label>
              <input
                type="text"
                placeholder="เช่น ตู้เย็น 2 ประตู 500 ลิตร สำหรับส่งออก"
                value={newModelDesc}
                onChange={(e) => setNewModelDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Save className="w-3.5 h-3.5" />
              <span>บันทึกโมเดลและคำนวณอัตโนมัติ</span>
            </button>
          </div>
        </form>
      )}

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Forecasted Daily Volume
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {summary.totalDaily.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">เครื่อง/วัน</span>
          </div>
          <span className="text-[11px] text-blue-600 font-mono block mt-1">
            Monthly ({workingDaysPerMonth}d): {summary.totalMonthly.toLocaleString()} pcs
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Annual Forecast (12 เดือน)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-indigo-700 font-mono">
              {summary.totalAnnual.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">เครื่อง/ปี</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block mt-1">
            เฉลี่ย {(summary.totalDaily / 2).toLocaleString()} pcs/กะ
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Forecasted Headcount (MP)
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-yellow-600 font-mono">
              {summary.totalHeadcount}
            </span>
            <span className="text-xs text-slate-500">คน (MP)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block mt-1">
            DL: {summary.totalDL} | IDL: {summary.totalIDL} | Sp: {summary.totalSpare}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Forecasted DL UPPH
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600 font-mono">
              {summary.avgDlUpph.toFixed(3)}
            </span>
            <span className="text-xs text-slate-500">units/man-h</span>
          </div>
          <span className="text-[11px] text-emerald-700 font-mono block mt-1">
            ประสิทธิภาพระดับสากล
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold block">
            Estimated Labor Cost / Unit
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-purple-700 font-mono">
              {summary.avgCostPerUnit.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">บาท/เครื่อง</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block mt-1">
            Total Payroll: {(summary.totalPayroll / 1000000).toFixed(2)}M THB/ด.
          </span>
        </div>
      </div>

      {/* Main Volume Forecast by Model Sheet Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span>ตารางวิเคราะห์ Volume Forecast, Takt Time (TT), Cycle Time (CT) และกำลังคนราย Model</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 bg-slate-200 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setViewFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ทุกไลน์ (All Lines)
              </button>
              <button
                onClick={() => setViewFilter('line-a')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'line-a' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line A
              </button>
              <button
                onClick={() => setViewFilter('line-b')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  viewFilter === 'line-b' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line B
              </button>
            </div>
          </div>
        </div>

        {/* The Spreadsheet Matrix */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase">
                <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Model & Code</th>
                <th className="py-2.5 px-3">Line</th>
                <th className="py-2.5 px-3">Plan Month / Market</th>
                <th className="py-2.5 px-3 text-right">Daily Vol</th>
                <th className="py-2.5 px-3 text-right">Shift Vol</th>
                <th className="py-2.5 px-3 text-right">Monthly ({workingDaysPerMonth}d)</th>
                <th className="py-2.5 px-3 text-right">Mix %</th>
                <th className="py-2.5 px-3 text-right bg-blue-50/70 text-blue-900">
                  Takt Time (TT)
                </th>
                <th className="py-2.5 px-3 text-right bg-blue-50/70 text-blue-900">
                  Cycle Time (CT)
                </th>
                <th className="py-2.5 px-3 text-right bg-blue-50/70 text-blue-900">
                  Work Content
                </th>
                <th className="py-2.5 px-3 text-center bg-blue-50/70 text-blue-900">
                  TT vs CT Buffer
                </th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/70 text-emerald-900">
                  Req. UPH
                </th>
                <th className="py-2.5 px-3 text-right bg-yellow-50/70 text-yellow-900">
                  DL MP / Shift
                </th>
                <th className="py-2.5 px-3 text-right bg-yellow-50/70 text-yellow-900">
                  DL (2 Shifts)
                </th>
                <th className="py-2.5 px-3 text-right bg-yellow-50/70 text-yellow-900">
                  Total MP (DL+IDL+Sp)
                </th>
                <th className="py-2.5 px-3 text-right">DL UPPH</th>
                <th className="py-2.5 px-3 text-right">Cost/Unit</th>
                <th className="py-2.5 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {forecastRows
                .filter((r) => viewFilter === 'all' || r.line === viewFilter)
                .map((row) => {
                  const isEditing = editingModelId === row.id;
                  const isLineA = row.line === 'line-a';
                  const isCtSafe = row.cycleTimeSec <= row.taktTimeSec;

                  if (isEditing) {
                    return (
                      <tr key={row.id} className="bg-blue-50/80 border-2 border-blue-400">
                        <td className="py-2 px-3 sticky left-0 bg-blue-50 z-10 font-sans space-y-1">
                          <input
                            type="text"
                            value={editBuffer.name ?? row.name}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-bold outline-none"
                            placeholder="ชื่อโมเดล"
                          />
                          <input
                            type="text"
                            value={editBuffer.modelCode ?? row.modelCode}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, modelCode: e.target.value }))}
                            className="w-24 px-2 py-1 bg-white border border-blue-400 rounded text-xs font-mono font-bold outline-none"
                            placeholder="รหัสโมเดล"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={editBuffer.line ?? row.line}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, line: e.target.value as any }))}
                            className="px-2 py-1 bg-white border border-blue-400 rounded text-xs font-semibold outline-none"
                          >
                            <option value="line-a">Line A</option>
                            <option value="line-b">Line B</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 font-sans text-[11px] space-y-1">
                          <input
                            type="text"
                            value={editBuffer.planMonth ?? row.planMonth ?? 'ตุลาคม 2026'}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, planMonth: e.target.value }))}
                            className="w-full px-1.5 py-0.5 bg-white border border-blue-400 rounded outline-none"
                          />
                          <input
                            type="text"
                            value={editBuffer.customerOrMarket ?? row.customerOrMarket ?? ''}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, customerOrMarket: e.target.value }))}
                            className="w-full px-1.5 py-0.5 bg-white border border-blue-400 rounded outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="50"
                            min="100"
                            value={editBuffer.dailyVolume ?? row.dailyVolume}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, dailyVolume: Number(e.target.value) || 0 }))}
                            className="w-20 px-1.5 py-0.5 bg-white border border-blue-400 rounded text-right font-bold text-blue-700 outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="0.5"
                            min="5"
                            max="60"
                            value={editBuffer.modelCycleTimeSec ?? row.cycleTimeSec}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, modelCycleTimeSec: Number(e.target.value) || 0 }))}
                            className="w-16 px-1.5 py-0.5 bg-white border border-blue-400 rounded text-right font-bold text-blue-700 outline-none"
                            title="Cycle Time ประจำ Model (sec)"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="10"
                            min="100"
                            max="5000"
                            value={editBuffer.workContentSec ?? row.workContentSec}
                            onChange={(e) => setEditBuffer((prev) => ({ ...prev, workContentSec: Number(e.target.value) || 0 }))}
                            className="w-20 px-1.5 py-0.5 bg-white border border-blue-400 rounded text-right font-bold text-blue-700 outline-none"
                            title="Work Content (วินาทีต่อเครื่อง)"
                          />
                        </td>
                        <td className="py-2 px-3 text-center text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleSaveEdit(row.id)}
                              className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded"
                              title="บันทึก"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded"
                              title="ยกเลิก"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 sticky left-0 bg-white z-10 font-sans font-semibold text-slate-900 flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isLineA ? 'bg-blue-600' : 'bg-emerald-600'}`}></span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">{row.name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">({row.modelCode})</span>
                            {row.isMain && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                Main
                              </span>
                            )}
                          </div>
                          {row.description && (
                            <p className="text-[10px] text-slate-400 font-sans truncate max-w-xs">{row.description}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isLineA ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLineA ? 'Line A' : 'Line B'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-sans text-xs">
                        <div className="font-medium text-slate-800">{row.planMonth || 'ตุลาคม 2026'}</div>
                        <div className="text-[10px] text-slate-400">{row.customerOrMarket || 'ตลาดในประเทศ'}</div>
                      </td>

                      {/* Editable Direct Daily Vol */}
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="50"
                            min="0"
                            value={row.dailyVol}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              onUpdateModelVolume(row.id, { dailyVolume: val });
                              triggerNotice(`✓ แก้ไขยอด Volume ของ ${row.name} เป็น ${val.toLocaleString()} pcs และบันทึกอัตโนมัติแล้ว`);
                            }}
                            className={`w-20 px-1.5 py-0.5 text-right font-mono font-bold border rounded outline-none ${
                              isLineA 
                                ? 'bg-blue-50/50 border-blue-200 text-blue-800 focus:border-blue-500' 
                                : 'bg-emerald-50/50 border-emerald-200 text-emerald-800 focus:border-emerald-500'
                            }`}
                            title="พิมพ์เปลี่ยนยอดตัวเลข Volume ได้โดยตรง"
                          />
                          <span className="text-[10px] text-slate-400 font-sans">pcs</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.shiftVol.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-700">
                        {row.monthlyVol.toLocaleString()}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-indigo-700">
                        {row.mixShare.toFixed(1)}%
                      </td>

                      {/* Takt Time (TT) */}
                      <td className="py-2.5 px-3 text-right font-bold bg-blue-50/40 text-blue-900">
                        {row.taktTimeSec.toFixed(1)}s
                      </td>

                      {/* Cycle Time (CT) */}
                      <td className="py-2.5 px-3 text-right font-bold bg-blue-50/40 text-slate-900">
                        {row.cycleTimeSec.toFixed(1)}s
                      </td>

                      {/* Work Content */}
                      <td className="py-2.5 px-3 text-right bg-blue-50/40 text-slate-800" title={`${(row.workContentSec / 60).toFixed(1)} นาที`}>
                        {row.workContentSec.toLocaleString()}s <span className="text-[10px] text-slate-400">({(row.workContentSec / 60).toFixed(1)}m)</span>
                      </td>

                      {/* Speed buffer */}
                      <td className="py-2.5 px-3 text-center bg-blue-50/40">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCtSafe ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {isCtSafe ? `+${row.speedBufferPercent.toFixed(1)}% (เร็วพอ)` : `${row.speedBufferPercent.toFixed(1)}% (คอขวด)`}
                        </span>
                      </td>

                      {/* Required UPH */}
                      <td className="py-2.5 px-3 text-right font-bold bg-emerald-50/40 text-emerald-800">
                        {row.requiredUph}
                      </td>

                      {/* DL Headcount per shift */}
                      <td className="py-2.5 px-3 text-right font-bold bg-yellow-50/40 text-slate-900">
                        {row.theoreticalDlPerShift} คน
                      </td>

                      {/* DL Headcount both shifts */}
                      <td className="py-2.5 px-3 text-right font-bold bg-yellow-50/40 text-blue-700">
                        {row.theoreticalDlBothShifts} คน
                      </td>

                      {/* Grand Total Headcount */}
                      <td className="py-2.5 px-3 text-right font-black bg-yellow-50/40 text-yellow-700">
                        {row.grandTotalHeadcount} คน
                      </td>

                      {/* DL UPPH */}
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {row.dlUpph.toFixed(3)}
                      </td>

                      {/* Cost per unit */}
                      <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                        {row.laborCostPerUnit.toFixed(1)} ฿
                      </td>

                      {/* Edit & Delete Buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleStartEdit(row)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                            title="แก้ไขชื่อโมเดล, รหัส, Volume, CT, Work Content"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {onDeleteModelVolume && !row.isMain && (
                            <button
                              onClick={() => handleDeleteModel(row.id, row.name)}
                              className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                              title="ลบโมเดลนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

              {/* Total Summary Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-3 px-3 font-sans sticky left-0 bg-slate-100 z-10 text-sm">
                  รวมทุก Model ในแผน (Total Forecast)
                </td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3">-</td>
                <td className="py-3 px-3 text-right font-extrabold text-blue-800">
                  {summary.totalDaily.toLocaleString()} pcs
                </td>
                <td className="py-3 px-3 text-right text-slate-800">
                  {(summary.totalDaily / shiftsPerDay).toLocaleString()} pcs
                </td>
                <td className="py-3 px-3 text-right text-slate-800">
                  {summary.totalMonthly.toLocaleString()} pcs
                </td>
                <td className="py-3 px-3 text-right text-purple-700">100.0%</td>
                <td className="py-3 px-3 text-right text-slate-500 bg-blue-100/50">-</td>
                <td className="py-3 px-3 text-right text-slate-500 bg-blue-100/50">-</td>
                <td className="py-3 px-3 text-right text-slate-500 bg-blue-100/50">-</td>
                <td className="py-3 px-3 text-center bg-blue-100/50">✓ สอดคล้อง</td>
                <td className="py-3 px-3 text-right bg-emerald-100/50 text-emerald-800 font-extrabold">
                  {forecastRows.reduce((s, r) => s + r.requiredUph, 0)} UPH
                </td>
                <td className="py-3 px-3 text-right bg-yellow-100/50 text-slate-900 font-bold">
                  {Math.round(summary.totalDL / shiftsPerDay)} คน
                </td>
                <td className="py-3 px-3 text-right bg-yellow-100/50 text-blue-800 font-extrabold">
                  {summary.totalDL} คน
                </td>
                <td className="py-3 px-3 text-right bg-yellow-100/50 text-yellow-800 font-black text-sm">
                  {summary.totalHeadcount} คน
                </td>
                <td className="py-3 px-3 text-right text-emerald-700 font-extrabold">
                  {summary.avgDlUpph.toFixed(3)}
                </td>
                <td className="py-3 px-3 text-right text-purple-700 font-extrabold">
                  {summary.avgCostPerUnit.toFixed(1)} ฿
                </td>
                <td className="py-3 px-3 text-center">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering Knowledge Callout: How TT, CT & Work Content are related */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span>หลักการและสูตรคำนวณ IE สำหรับ Volume Forecast (Industrial Engineering Standard):</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
            <span className="font-bold text-slate-800 block">1. Takt Time (TT - จังหวะเวลาตามความต้องการของลูกค้า):</span>
            <p className="text-slate-600 text-[11px]">
              คำนวณจากเวลาทำงานสุทธิต่อวัน (Net Operating Time) หารด้วยยอดความต้องการผลิตรายวัน (Daily Volume)
            </p>
            <code className="text-blue-700 text-[11px] block font-mono bg-blue-50 p-1 rounded">
              TT = (Shifts × Net_Hours × 3600 × OEE%) / Daily_Volume
            </code>
          </div>

          <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
            <span className="font-bold text-slate-800 block">2. Cycle Time (CT - รอบเวลาของเครื่องจักรและสายพาน):</span>
            <p className="text-slate-600 text-[11px]">
              ความเร็วรอบจริงของสายการผลิต โดยหลักวิศวกรรม <strong>Cycle Time (CT) ต้องน้อยกว่าหรือเท่ากับ Takt Time (TT) เสมอ</strong> เพื่อให้ผลิตทันยอดและมี Speed Reserve Buffer ป้องกันความแปรปรวน
            </p>
            <code className="text-blue-700 text-[11px] block font-mono bg-blue-50 p-1 rounded">
              Speed Buffer % = ((TT - CT) / TT) × 100%
            </code>
          </div>

          <div className="bg-white p-3 rounded-lg border border-blue-100 space-y-1">
            <span className="font-bold text-slate-800 block">3. คาดการณ์กำลังคน Direct Labor (DL) อย่างแม่นยำ:</span>
            <p className="text-slate-600 text-[11px]">
              คำนวณจากปริมาณงานสะสมรวม (Total Work Content) ของชิ้นงานแต่ละรุ่น หารด้วยจังหวะเวลา Takt Time (TT)
            </p>
            <code className="text-blue-700 text-[11px] block font-mono bg-blue-50 p-1 rounded">
              DL_Headcount (Both) = ⌈Total Work Content / Takt Time⌉
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
