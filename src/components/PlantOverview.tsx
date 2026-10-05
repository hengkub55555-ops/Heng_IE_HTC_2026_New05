import React, { useState } from 'react';
import { StationData, IndirectLaborData, SpareLaborData, ProductionLineConfig, ModelVolumeItem } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Factory, 
  Users, 
  Gauge, 
  Clock, 
  TrendingUp, 
  GitCompare, 
  ArrowRight, 
  DollarSign, 
  PieChart, 
  CheckCircle2, 
  Edit3
} from 'lucide-react';
import { VolumeModelManagement } from './VolumeModelManagement';

interface PlantOverviewProps {
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
  onUpdateStationA?: (id: string, updates: Partial<StationData>) => void;
  onUpdateStationB?: (id: string, updates: Partial<StationData>) => void;
  onUpdateConfigA?: (updates: Partial<ProductionLineConfig>) => void;
  onUpdateConfigB?: (updates: Partial<ProductionLineConfig>) => void;
  onBatchUpdateUphA?: (newUph: number) => void;
  onBatchUpdateUphB?: (newUph: number) => void;
}

export const PlantOverview: React.FC<PlantOverviewProps> = ({
  modelVolumes,
  onAddModelVolume,
  onUpdateModelVolume,
  onDeleteModelVolume,
  onResetModelVolumes,
  lineAData,
  lineBData,
  onSelectLine,
  onUpdateStationA,
  onUpdateStationB,
  onUpdateConfigA,
  onUpdateConfigB,
  onBatchUpdateUphA,
  onBatchUpdateUphB,
}) => {
  const [isEditingTable, setIsEditingTable] = useState<boolean>(true);

  const totalPlantDailyOutput = lineAData.config.targetDailyOutput + lineBData.config.targetDailyOutput;
  const totalPlantHeadcount = lineAData.metrics.grandTotalHeadcount + lineBData.metrics.grandTotalHeadcount;
  const totalPlantDL = lineAData.metrics.totalDLBothShifts + lineBData.metrics.totalDLBothShifts;
  const totalPlantIDL = lineAData.metrics.totalIDL + lineBData.metrics.totalIDL;
  const totalPlantSpare = lineAData.metrics.totalSpareBothShifts + lineBData.metrics.totalSpareBothShifts;
  const totalPlantPayrollTHB = lineAData.metrics.monthlyTotalPayrollTHB + lineBData.metrics.monthlyTotalPayrollTHB;

  // Station-by-station comparison (Stations 1 to 8)
  const stationComparison = [1, 2, 3, 4, 5, 6, 7, 8].map((no) => {
    const stA_shiftA = lineAData.stations.find((s) => s.no === no && s.shift === 'Shift-A');
    const stA_shiftB = lineAData.stations.find((s) => s.no === no && s.shift === 'Shift-B');
    const stB_shiftA = lineBData.stations.find((s) => s.no === no && s.shift === 'Shift-A');
    const stB_shiftB = lineBData.stations.find((s) => s.no === no && s.shift === 'Shift-B');

    return {
      no,
      name: stB_shiftA?.name.replace(' (Shift-A)', '') || `Station ${no}`,
      thaiName: stB_shiftA?.thaiName.replace(' (กะ A)', '') || '',
      stA_shiftA,
      stA_shiftB,
      stB_shiftA,
      stB_shiftB,
      lineAMp: stA_shiftA?.stdMp || 0,
      lineBMp: stB_shiftA?.stdMp || 0,
      lineAUph: stA_shiftA?.uph || 0,
      lineBUph: stB_shiftA?.uph || 0,
      lineACt: stA_shiftA?.ct || 0,
      lineBCt: stB_shiftA?.ct || 0,
      lineAUpph: stA_shiftA?.upph || 0,
      lineBUpph: stB_shiftA?.upph || 0,
      mpDelta: (stA_shiftA?.stdMp || 0) - (stB_shiftA?.stdMp || 0),
    };
  });

  const handleUpdateMpA = (stNo: number, newMp: number) => {
    if (!onUpdateStationA) return;
    const stShiftA = lineAData.stations.find((s) => s.no === stNo && s.shift === 'Shift-A');
    const stShiftB = lineAData.stations.find((s) => s.no === stNo && s.shift === 'Shift-B');
    const newUpph = Math.round(lineAData.config.targetUph / (newMp || 1));
    const newOutput = Math.round((lineAData.config.targetUph * lineAData.config.netShiftHours) / (newMp || 1));

    if (stShiftA) onUpdateStationA(stShiftA.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    if (stShiftB) onUpdateStationA(stShiftB.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
  };

  const handleUpdateMpB = (stNo: number, newMp: number) => {
    if (!onUpdateStationB) return;
    const stShiftA = lineBData.stations.find((s) => s.no === stNo && s.shift === 'Shift-A');
    const stShiftB = lineBData.stations.find((s) => s.no === stNo && s.shift === 'Shift-B');
    const newUpph = Math.round(lineBData.config.targetUph / (newMp || 1));
    const newOutput = Math.round((lineBData.config.targetUph * lineBData.config.netShiftHours) / (newMp || 1));

    if (stShiftA) onUpdateStationB(stShiftA.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
    if (stShiftB) onUpdateStationB(stShiftB.id, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-lg">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Plant Overview & Multi-Line Comparison (ภาพรวมเปรียบเทียบ Line A vs Line B)
              </h2>
              <p className="text-xs text-slate-500">
                วิเคราะห์กำลังคนและประสิทธิภาพการผลิตรวมของทั้งโรงงาน 2 สายการผลิตคู่ขนาน · สามารถแก้ไขตัวเลขได้โดยตรง
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onSelectLine('line-a')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <span>จัดการ Line A</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onSelectLine('line-b')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <span>จัดการ Line B (ต้นฉบับ)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Plant Total KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Factory Daily Output
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {totalPlantDailyOutput.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">pcs/day</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Line A ({lineAData.config.targetDailyOutput.toLocaleString()}) + Line B ({lineBData.config.targetDailyOutput.toLocaleString()})
            </p>
          </div>

          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
            <span className="text-[11px] font-medium text-purple-700 uppercase tracking-wider block">
              Total Plant Headcount
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-purple-900 font-mono">
                {totalPlantHeadcount}
              </span>
              <span className="text-xs text-purple-600">คน (MP)</span>
            </div>
            <p className="text-[11px] text-purple-700 mt-1">
              Line A ({lineAData.metrics.grandTotalHeadcount}) + Line B ({lineBData.metrics.grandTotalHeadcount})
            </p>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">
              Direct Labor (DL Total)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-900 font-mono">
                {totalPlantDL}
              </span>
              <span className="text-xs text-blue-600">คน ({((totalPlantDL / totalPlantHeadcount) * 100).toFixed(1)}%)</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              IDL: {totalPlantIDL} คน · Spare: {totalPlantSpare} คน
            </p>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
              Total Monthly Labor Cost
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {(totalPlantPayrollTHB / 1000000).toFixed(2)}M
              </span>
              <span className="text-xs text-emerald-600">THB/เดือน</span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              เฉลี่ย {((totalPlantPayrollTHB) / (totalPlantDailyOutput * 26)).toFixed(1)} บาท/เครื่อง
            </p>
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

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line A Card */}
        <div className="bg-white rounded-xl border border-blue-200 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-blue-600 text-white font-bold flex items-center justify-center font-mono text-xs">
                  A
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Line A (A-Line)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: {lineAData.config.model}
              </p>
            </div>
            <button
              onClick={() => onSelectLine('line-a')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md"
            >
              แก้ไข Line A →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Target Output</span>
              <strong className="text-base text-slate-900">{lineAData.config.targetDailyOutput.toLocaleString()}</strong> pcs/day
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Target UPH</span>
              <strong className="text-base text-blue-700">{lineAData.config.targetUph}</strong> units/h
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Total Headcount</span>
              <strong className="text-base text-yellow-600">{lineAData.metrics.grandTotalHeadcount}</strong> คน
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Cycle Time / Takt</span>
              <strong className="text-base text-purple-700">{lineAData.config.designCycleTimeSec}s</strong> / {lineAData.metrics.taktTimeSec.toFixed(1)}s
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Direct Labor (2 Shifts):</span>
              <span className="font-mono font-bold">{lineAData.metrics.totalDLBothShifts} คน ({lineAData.metrics.totalDLPerShift}/shift)</span>
            </div>
            <div className="flex justify-between">
              <span>Indirect Labor (IDL):</span>
              <span className="font-mono font-bold">{lineAData.metrics.totalIDL} คน</span>
            </div>
            <div className="flex justify-between">
              <span>Line DL UPPH:</span>
              <span className="font-mono font-bold text-emerald-700">{lineAData.metrics.overallDLUPPH.toFixed(3)} pcs/man-h</span>
            </div>
          </div>
        </div>

        {/* Line B Card */}
        <div className="bg-white rounded-xl border border-emerald-200 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600"></div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center font-mono text-xs">
                  B
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Line B (B-Line) · ข้อมูลต้นฉบับ
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Model: {lineBData.config.model}
              </p>
            </div>
            <button
              onClick={() => onSelectLine('line-b')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md"
            >
              แก้ไข Line B →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 text-xs font-mono">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Target Output</span>
              <strong className="text-base text-slate-900">{lineBData.config.targetDailyOutput.toLocaleString()}</strong> pcs/day
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Target UPH</span>
              <strong className="text-base text-emerald-700">{lineBData.config.targetUph}</strong> units/h
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Total Headcount</span>
              <strong className="text-base text-yellow-600">{lineBData.metrics.grandTotalHeadcount}</strong> คน
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Cycle Time / Takt</span>
              <strong className="text-base text-purple-700">{lineBData.config.designCycleTimeSec}s</strong> / {lineBData.metrics.taktTimeSec.toFixed(1)}s
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Direct Labor (2 Shifts):</span>
              <span className="font-mono font-bold">{lineBData.metrics.totalDLBothShifts} คน ({lineBData.metrics.totalDLPerShift}/shift)</span>
            </div>
            <div className="flex justify-between">
              <span>Indirect Labor (IDL):</span>
              <span className="font-mono font-bold">{lineBData.metrics.totalIDL} คน</span>
            </div>
            <div className="flex justify-between">
              <span>Line DL UPPH:</span>
              <span className="font-mono font-bold text-emerald-700">{lineBData.metrics.overallDLUPPH.toFixed(3)} pcs/man-h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Station-by-Station Direct Comparison Table (Directly Editable) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              ตารางเปรียบเทียบกำลังคนรายสถานี (Line A vs Line B Station-by-Station)
            </h3>
            <p className="text-xs text-slate-500">
              แก้ไขจำนวนคน (STD MP ต่อกะ) และค่าต่างๆ ได้โดยตรงในตารางนี้
            </p>
          </div>
          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded font-medium border border-blue-200 self-start sm:self-auto">
            ✎ ช่องตารางสามารถคลิกพิมพ์แก้ไขตัวเลขได้ทันที
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 uppercase">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">No.</th>
                <th className="py-2.5 px-4 min-w-[200px] border-r border-slate-200">Station Detail</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-blue-50/70 text-blue-900">Line A MP ✎</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-900">Line B MP ✎</th>
                <th className="py-2.5 px-3 text-center border-r border-slate-200">ผลต่าง (Delta)</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Line A UPH</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Line B UPH</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Line A CT</th>
                <th className="py-2.5 px-3 text-right border-r border-slate-200">Line B CT</th>
                <th className="py-2.5 px-3 text-right">Line A / B UPPH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {stationComparison.map((st) => (
                <tr key={st.no} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-center font-sans font-semibold text-slate-500 border-r border-slate-200">
                    #{st.no}
                  </td>
                  <td className="py-2 px-4 font-sans font-medium text-slate-800 border-r border-slate-200">
                    {st.name}
                  </td>

                  {/* Line A MP (Editable Input) */}
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 bg-blue-50/30">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={st.lineAMp}
                      onChange={(e) => handleUpdateMpA(st.no, parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 py-0.5 text-center font-bold text-blue-800 border border-blue-300 rounded bg-white font-mono shadow-2xs"
                      title="แก้ไขจำนวนคน Line A ประจำสถานีนี้"
                    />
                  </td>

                  {/* Line B MP (Editable Input) */}
                  <td className="py-1.5 px-2 text-center border-r border-slate-200 bg-emerald-50/30">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={st.lineBMp}
                      onChange={(e) => handleUpdateMpB(st.no, parseFloat(e.target.value) || 0)}
                      className="w-16 px-1 py-0.5 text-center font-bold text-emerald-800 border border-emerald-300 rounded bg-white font-mono shadow-2xs"
                      title="แก้ไขจำนวนคน Line B ประจำสถานีนี้"
                    />
                  </td>

                  <td className="py-2 px-3 text-center border-r border-slate-200 font-bold">
                    {st.mpDelta === 0 ? (
                      <span className="text-slate-400">0</span>
                    ) : st.mpDelta < 0 ? (
                      <span className="text-blue-600">{st.mpDelta} (A น้อยกว่า)</span>
                    ) : (
                      <span className="text-amber-600">+{st.mpDelta} (A มากกว่า)</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{st.lineAUph}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{st.lineBUph}</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{st.lineACt}s</td>
                  <td className="py-2 px-3 text-right border-r border-slate-200">{st.lineBCt}s</td>
                  <td className="py-2 px-3 text-right font-semibold">
                    <span className="text-blue-700">{st.lineAUpph}</span> / <span className="text-emerald-700">{st.lineBUpph}</span>
                  </td>
                </tr>
              ))}

              {/* Subtotal DL Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                <td className="py-2.5 px-3 border-r border-slate-200"></td>
                <td className="py-2.5 px-4 font-sans border-r border-slate-200">
                  Total DL per shift (รวม 2 กะ)
                </td>
                <td className="py-2.5 px-3 text-center font-extrabold text-blue-900 bg-blue-100 border-r border-slate-200">
                  {lineAData.metrics.totalDLPerShift} ({lineAData.metrics.totalDLBothShifts})
                </td>
                <td className="py-2.5 px-3 text-center font-extrabold text-emerald-900 bg-emerald-100 border-r border-slate-200">
                  {lineBData.metrics.totalDLPerShift} ({lineBData.metrics.totalDLBothShifts})
                </td>
                <td className="py-2.5 px-3 text-center border-r border-slate-200">
                  {lineAData.metrics.totalDLBothShifts - lineBData.metrics.totalDLBothShifts}
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200">{lineAData.config.targetUph}</td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200">{lineBData.config.targetUph}</td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200">{lineAData.config.designCycleTimeSec}s</td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200">{lineBData.config.designCycleTimeSec}s</td>
                <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                  {lineAData.metrics.overallDLUPPH.toFixed(3)} / {lineBData.metrics.overallDLUPPH.toFixed(3)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
