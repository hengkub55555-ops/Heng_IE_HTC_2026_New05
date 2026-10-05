import React, { useState } from 'react';
import { StationData, ProductionLineConfig, IndirectLaborData, SpareLaborData } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Sparkles, 
  TrendingUp, 
  DollarSign, 
  Users, 
  RotateCcw, 
  Check, 
  ArrowRight,
  Zap,
  TrendingDown,
  Layers
} from 'lucide-react';

interface KaizenSimulatorProps {
  stations: StationData[];
  idlList: IndirectLaborData[];
  sparesList: SpareLaborData[];
  config: ProductionLineConfig;
  baselineMetrics: IEMetrics;
  onApplyKaizenToMaster: (
    newStations: StationData[], 
    newConfig: ProductionLineConfig,
    newIdl: IndirectLaborData[],
    newSpares: SpareLaborData[]
  ) => void;
}

export const KaizenSimulator: React.FC<KaizenSimulatorProps> = ({
  stations,
  idlList,
  sparesList,
  config,
  baselineMetrics,
  onApplyKaizenToMaster,
}) => {
  // Delta MP per station (per shift)
  const [stationDeltas, setStationDeltas] = useState<Record<number, number>>({
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
  });

  const [simulatedUph, setSimulatedUph] = useState<number>(config.targetUph);
  const [simulatedNetHours, setSimulatedNetHours] = useState<number>(config.netShiftHours);
  const [sparePercent, setSparePercent] = useState<number>(5.7); // 5.7% baseline
  const [idlAdjustment, setIdlAdjustment] = useState<number>(0);

  // Group stations by No (1 to 8)
  const uniqueStations = [1, 2, 3, 4, 5, 6, 7, 8].map((no) => {
    const stA = stations.find((s) => s.no === no && s.shift === 'Shift-A')!;
    const delta = stationDeltas[no] || 0;
    const currentMp = stA.stdMp;
    const simMp = Math.max(1, currentMp + delta);
    const simUpph = Math.round(simulatedUph / simMp);
    const simOutputPerShift = Math.round((simulatedUph * simulatedNetHours) / simMp);

    return {
      no,
      name: stA.name.replace(' (Shift-A)', ''),
      thaiName: stA.thaiName.replace(' (กะ A)', ''),
      baseMp: currentMp,
      delta,
      simMp,
      simUpph,
      simOutputPerShift,
      ct: stA.ct,
    };
  });

  // Calculate simulated totals
  const totalSimDlPerShift = uniqueStations.reduce((sum, s) => sum + s.simMp, 0);
  const totalSimDlBothShifts = totalSimDlPerShift * 2;
  const totalSimIdl = Math.max(1, baselineMetrics.totalIDL + idlAdjustment);
  const totalSimSpareBothShifts = Math.round((totalSimDlBothShifts * sparePercent) / 100);
  const simGrandTotal = totalSimDlBothShifts + totalSimIdl + totalSimSpareBothShifts;

  // Manpower delta compared to baseline
  const totalMpDelta = simGrandTotal - baselineMetrics.grandTotalHeadcount;
  const isHeadcountSaved = totalMpDelta < 0;

  // UPPH & Productivity comparison
  const simDlUpph = totalSimDlPerShift > 0 ? simulatedUph / totalSimDlPerShift : 0;
  const upphChangePercent = baselineMetrics.overallDLUPPH > 0 
    ? ((simDlUpph - baselineMetrics.overallDLUPPH) / baselineMetrics.overallDLUPPH) * 100 
    : 0;

  // Annual Financial Impact (THB)
  const monthlySavingsTHB = Math.abs(totalMpDelta) * config.monthlySalaryDLTHB;
  const annualSavingsTHB = monthlySavingsTHB * 12;

  // Simulated Work Content
  const simWorkContentSec = uniqueStations.reduce((sum, s) => sum + s.simMp * s.ct, 0);

  // Preset Kaizen Scenarios
  const applyPreset = (preset: 'baseline' | 'leanAutomation' | 'highDemand' | 'rebalance') => {
    if (preset === 'baseline') {
      setStationDeltas({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
      setSimulatedUph(110);
      setSimulatedNetHours(10.5);
      setIdlAdjustment(0);
      setSparePercent(5.7);
    } else if (preset === 'leanAutomation') {
      // Focus on high headcount: Inner Box -6, Assembly -4, Cab pre-assy -3, Final Packing -3
      setStationDeltas({
        1: 0,
        2: -6, // Inner Box automation
        3: -3, // Pre-assy jig improvement
        4: -1, // PU foam demold helper
        5: -4, // Assembly line rebalancing & auto screwdrivers
        6: 0,
        7: -3, // Auto carton strapping & door assist
        8: 0,
      });
      setSimulatedUph(110);
      setIdlAdjustment(-2);
      setSparePercent(5.0);
    } else if (preset === 'highDemand') {
      // Ramp up to 125 UPH (2,800 units/day)
      setSimulatedUph(125);
      setStationDeltas({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 });
    } else if (preset === 'rebalance') {
      // Aggressive Kaizen across all stations
      setStationDeltas({
        1: -1,
        2: -8,
        3: -5,
        4: -2,
        5: -6,
        6: -2,
        7: -4,
        8: 0,
      });
      setSimulatedUph(115);
      setIdlAdjustment(-3.5);
      setSparePercent(4.5);
    }
  };

  const handleApplyChanges = () => {
    // Generate new stations array
    const newStations: StationData[] = stations.map((st) => {
      const delta = stationDeltas[st.no] || 0;
      const newMp = Math.max(1, st.stdMp + delta);
      const newUpph = Math.round(simulatedUph / newMp);
      const newOutput = Math.round((simulatedUph * simulatedNetHours) / newMp);

      return {
        ...st,
        stdMp: newMp,
        uph: simulatedUph,
        upph: newUpph,
        outputPerShift: newOutput,
      };
    });

    const newConfig: ProductionLineConfig = {
      ...config,
      targetUph: simulatedUph,
      netShiftHours: simulatedNetHours,
      targetDailyOutput: Math.round(simulatedUph * simulatedNetHours * 2),
    };

    const newIdl = idlList.map((item, idx) => {
      if (idx === 1) { // adjust sup leaders if IDL adjusted
        return { ...item, stdMp: Math.max(1, item.stdMp + idlAdjustment) };
      }
      return item;
    });

    const newSpares = sparesList.map((sp) => ({
      ...sp,
      stdMp: totalSimSpareBothShifts / 2,
    }));

    onApplyKaizenToMaster(newStations, newConfig, newIdl, newSpares);
  };

  return (
    <div className="space-y-6">
      {/* Header & Presets */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Kaizen & What-If Simulation Studio (ห้องทดลองจำลองปรับปรุงกำลังคน)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              จำลองผลกระทบเมื่อทำ Kaizen ลดคน ปรับปรุงอุปกรณ์ หรือเพิ่มกำลังการผลิต UPH พร้อมคำนวณเงินประหยัด (Cost Savings) อัตโนมัติ
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-500 font-medium mr-1">ชุดจำลองสำเร็จรูป:</span>
            <button
              onClick={() => applyPreset('baseline')}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              คืนค่ามาตรฐาน (Baseline)
            </button>
            <button
              onClick={() => applyPreset('leanAutomation')}
              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors"
            >
              ⚡ Lean Automation (-34 คน)
            </button>
            <button
              onClick={() => applyPreset('highDemand')}
              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
            >
              🚀 Ramp-up 125 UPH
            </button>
            <button
              onClick={() => applyPreset('rebalance')}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
            >
              🏆 Full Rebalance (-56 คน)
            </button>
          </div>
        </div>

        {/* Impact Comparison Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Simulated Total Headcount
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {simGrandTotal}
              </span>
              <span className="text-xs text-slate-400">คน</span>
            </div>
            <div className="mt-1 text-xs font-semibold flex items-center gap-1">
              {totalMpDelta === 0 ? (
                <span className="text-slate-500">เท่ากับ Baseline เดิม</span>
              ) : isHeadcountSaved ? (
                <span className="text-emerald-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" />
                  ลดได้ {Math.abs(totalMpDelta)} คน ({((Math.abs(totalMpDelta) / baselineMetrics.grandTotalHeadcount) * 100).toFixed(1)}%)
                </span>
              ) : (
                <span className="text-amber-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  เพิ่ม {totalMpDelta} คน
                </span>
              )}
            </div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block">
              Annual Cost Savings (ประหยัดต่อปี)
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700 font-mono">
                {isHeadcountSaved ? `${(annualSavingsTHB / 1000000).toFixed(2)}M` : '0'}
              </span>
              <span className="text-xs text-emerald-700">THB/ปี</span>
            </div>
            <p className="text-[11px] text-emerald-600 mt-1">
              {isHeadcountSaved ? `≈ ${(monthlySavingsTHB / 1000).toFixed(0)} พันบาท/เดือน` : 'ไม่มีผลประหยัดค่าแรง'}
            </p>
          </div>

          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200">
            <span className="text-[11px] font-medium text-blue-800 uppercase tracking-wider block">
              Simulated DL UPPH
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-800 font-mono">
                {simDlUpph.toFixed(3)}
              </span>
              <span className="text-xs text-blue-600">unit/man-h</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              {upphChangePercent >= 0 ? `+${upphChangePercent.toFixed(1)}%` : `${upphChangePercent.toFixed(1)}%`} ประสิทธิภาพแรงงาน
            </p>
          </div>

          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
            <span className="text-[11px] font-medium text-purple-800 uppercase tracking-wider block">
              Work Content ต่อตู้
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-purple-900 font-mono">
                {simWorkContentSec.toLocaleString()}
              </span>
              <span className="text-xs text-purple-600">sec</span>
            </div>
            <p className="text-[11px] text-purple-700 mt-1">
              {(simWorkContentSec / 60).toFixed(1)} นาที/เครื่อง (ลดลง {((baselineMetrics.totalWorkContentSecondsPerUnit - simWorkContentSec) / 60).toFixed(1)} นาที)
            </p>
          </div>
        </div>
      </div>

      {/* Global Parameter Sliders */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          ตัวแปรหลักการผลิต (Production Global Parameters)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>เป้าหมาย UPH (Units/Hour):</span>
              <span className="text-blue-700 font-mono text-sm">{simulatedUph} UPH</span>
            </div>
            <input
              type="range"
              min="90"
              max="140"
              step="5"
              value={simulatedUph}
              onChange={(e) => setSimulatedUph(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>90</span>
              <span>110 (Base)</span>
              <span>140</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>ชั่วโมงการผลิตสุทธิต่อกะ (Net Hours):</span>
              <span className="text-blue-700 font-mono text-sm">{simulatedNetHours} hrs</span>
            </div>
            <input
              type="range"
              min="8"
              max="11.5"
              step="0.5"
              value={simulatedNetHours}
              onChange={(e) => setSimulatedNetHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>8.0h (1 กะปกติ)</span>
              <span>10.5h (Base)</span>
              <span>11.5h</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>สัดส่วนกำลังคนสำรอง (Spare Buffer %):</span>
              <span className="text-emerald-700 font-mono text-sm">{sparePercent.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="2"
              max="8"
              step="0.5"
              value={sparePercent}
              onChange={(e) => setSparePercent(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>2.0%</span>
              <span>5.7% (Base: 38.5 คน)</span>
              <span>8.0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Station-by-Station Kaizen Tweaker */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              ปรับปรุงกำลังคนรายสถานี (Station Kaizen Adjustments)
            </h3>
            <p className="text-xs text-slate-500">
              กดปุ่ม + หรือ - เพื่อจำลองการลดหรือเพิ่มคนประจำแต่ละสถานี (ผลต่อกะ × 2 สำหรับ 2 กะ)
            </p>
          </div>
          <button
            onClick={() => setStationDeltas({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 })}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            รีเซ็ตค่าสถานีทั้งหมด
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {uniqueStations.map((st) => (
            <div
              key={st.no}
              className={`p-4 rounded-xl border transition-all ${
                st.delta !== 0
                  ? st.delta < 0
                    ? 'bg-purple-50/70 border-purple-300'
                    : 'bg-amber-50/70 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded bg-white text-slate-700 font-bold flex items-center justify-center font-mono text-xs border border-slate-200">
                  #{st.no}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Base: {st.baseMp} คน
                </span>
              </div>

              <h4 className="font-bold text-slate-900 text-xs mt-2 truncate" title={st.name}>
                {st.name}
              </h4>
              <p className="text-[11px] text-slate-500 truncate">{st.thaiName}</p>

              {/* Adjuster controls */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setStationDeltas((prev) => ({
                        ...prev,
                        [st.no]: (prev[st.no] || 0) - 1,
                      }));
                    }}
                    className="w-7 h-7 rounded-md bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-sm shadow-xs transition-colors"
                  >
                    -
                  </button>
                  <button
                    onClick={() => {
                      setStationDeltas((prev) => ({
                        ...prev,
                        [st.no]: (prev[st.no] || 0) + 1,
                      }));
                    }}
                    className="w-7 h-7 rounded-md bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold text-sm shadow-xs transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="text-right font-mono">
                  <span className="text-base font-black text-slate-900 block leading-tight">
                    {st.simMp} คน
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {st.delta !== 0 ? (
                      <strong className={st.delta < 0 ? 'text-purple-700' : 'text-amber-700'}>
                        {st.delta > 0 ? `+${st.delta}` : st.delta} คน/กะ
                      </strong>
                    ) : (
                      'คงเดิม'
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 font-mono flex justify-between border-t border-slate-200/50 pt-1">
                <span>UPPH: {st.simUpph}</span>
                <span>Output/sh: {st.simOutputPerShift}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Apply Changes Action Bar */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            💡 กดปุ่มเพื่อนำโครงสร้างกำลังคนที่จำลองนี้ไปอัปเดตตาราง Master Manning Sheet หลัก
          </div>
          <button
            onClick={handleApplyChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>ปรับใช้แผน Kaizen นี้กับระบบจริง (Apply to Master)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
