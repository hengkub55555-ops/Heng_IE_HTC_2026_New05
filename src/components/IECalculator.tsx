import React, { useState } from 'react';
import { ProductionLineConfig } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Calculator, 
  Clock, 
  Users, 
  Gauge, 
  DollarSign, 
  RotateCcw,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface IECalculatorProps {
  config: ProductionLineConfig;
  metrics: IEMetrics;
  onUpdateConfig: (updates: Partial<ProductionLineConfig>) => void;
}

export const IECalculator: React.FC<IECalculatorProps> = ({
  config,
  metrics,
  onUpdateConfig,
}) => {
  // Local state for interactive calculators
  const [dailyDemand, setDailyDemand] = useState<number>(config.targetDailyOutput);
  const [shiftsPerDay, setShiftsPerDay] = useState<number>(config.workingShiftsPerDay);
  const [grossShiftHours, setGrossShiftHours] = useState<number>(config.shiftHoursTotal);
  const [breakMinutes, setBreakMinutes] = useState<number>(90); // 1.5 hours break in 12h shift
  const [oeePercent, setOeePercent] = useState<number>(88); // 88% default OEE
  const [operatorAllowancePercent, setOperatorAllowancePercent] = useState<number>(10); // 10% allowance
  const [targetDlSalary, setTargetDlSalary] = useState<number>(config.monthlySalaryDLTHB);
  const [targetIdlSalary, setTargetIdlSalary] = useState<number>(config.monthlySalaryIDLTHB);

  // Calculations
  const grossMinutesPerShift = grossShiftHours * 60;
  const netMinutesPerShift = Math.max(0, grossMinutesPerShift - breakMinutes);
  const netHoursPerShift = netMinutesPerShift / 60;
  const netSecondsPerShift = netMinutesPerShift * 60;

  const targetOutputPerShift = dailyDemand / shiftsPerDay;
  const calculatedTaktTimeSec = targetOutputPerShift > 0 ? netSecondsPerShift / targetOutputPerShift : 0;
  const calculatedRequiredUph = netHoursPerShift > 0 ? targetOutputPerShift / netHoursPerShift : 0;

  // Manpower sizing based on current work content
  const workContentSec = metrics.totalWorkContentSecondsPerUnit || 7751;
  const theoreticalDlPerShift = calculatedTaktTimeSec > 0 ? workContentSec / calculatedTaktTimeSec : 0;
  const allowanceFactor = 1 + operatorAllowancePercent / 100;
  const adjustedDlPerShift = Math.ceil(theoreticalDlPerShift * allowanceFactor);
  const totalAdjustedDlBothShifts = adjustedDlPerShift * shiftsPerDay;

  // Speed reserve against line cycle time (23s)
  const lineSpeedReserve = calculatedTaktTimeSec > 0 
    ? ((calculatedTaktTimeSec - config.designCycleTimeSec) / calculatedTaktTimeSec) * 100 
    : 0;

  // Cost estimates
  const monthlyUnits = dailyDemand * 26; // 26 working days/month
  const totalMonthlyDlPayroll = totalAdjustedDlBothShifts * targetDlSalary;
  const totalMonthlyIdlPayroll = metrics.totalIDL * targetIdlSalary;
  const totalMonthlyPayroll = totalMonthlyDlPayroll + totalMonthlyIdlPayroll;
  const dlLaborCostPerUnit = monthlyUnits > 0 ? totalMonthlyDlPayroll / monthlyUnits : 0;
  const totalLaborCostPerUnit = monthlyUnits > 0 ? totalMonthlyPayroll / monthlyUnits : 0;

  const handleApplyToConfig = () => {
    onUpdateConfig({
      targetDailyOutput: dailyDemand,
      workingShiftsPerDay: shiftsPerDay,
      targetUph: Math.round(calculatedRequiredUph),
      netShiftHours: parseFloat(netHoursPerShift.toFixed(2)),
      shiftHoursTotal: grossShiftHours,
      monthlySalaryDLTHB: targetDlSalary,
      monthlySalaryIDLTHB: targetIdlSalary,
    });
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                IE Engineering Suite & Takt Time Calculator (เครื่องคิดเลขวิศวกรรมอุตสาหการ)
              </h2>
              <p className="text-xs text-slate-500">
                คำนวณ Takt Time, Cycle Time, Manpower Sizing, OEE Capacity และต้นทุนแรงงานต่อเครื่องแบบมาตรฐานสากล
              </p>
            </div>
          </div>

          <button
            onClick={handleApplyToConfig}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>บันทึกค่าเข้าสู่ {config.lineShortCode}-Line ({config.model})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid of Interactive Calculators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Takt Time & Net Working Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                1. Takt Time & Net Operating Time (เวลาแทคไทม์)
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
              TT = T_available / Demand
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                เป้าหมายยอดผลิตต่อวัน (Daily Demand)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="50"
                  value={dailyDemand}
                  onChange={(e) => setDailyDemand(Math.max(100, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono font-bold text-slate-800"
                />
                <span className="text-slate-400">units</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                จำนวนกะต่อวัน (Working Shifts)
              </label>
              <select
                value={shiftsPerDay}
                onChange={(e) => setShiftsPerDay(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800 bg-white"
              >
                <option value={1}>1 Shift (กะเดียว)</option>
                <option value={2}>2 Shifts (Shift A + Shift B - มาตรฐาน)</option>
                <option value={3}>3 Shifts (3 กะ 8 ชม.)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                ชั่วโมงการทำงานรวมต่อกะ (Gross Hours)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={grossShiftHours}
                  onChange={(e) => setGrossShiftHours(parseFloat(e.target.value) || 8)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800"
                />
                <span className="text-slate-400">hours</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                เวลาพักและสูญเสียรวมต่อกะ (Breaks & Meal)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="5"
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800"
                />
                <span className="text-slate-400">min</span>
              </div>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200/60">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Net Operating Time</span>
                <span className="text-base font-bold text-slate-800">{netHoursPerShift.toFixed(2)}h</span>
                <span className="text-[10px] text-slate-500 block font-sans">({netMinutesPerShift} นาที/กะ)</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                <span className="text-[10px] text-blue-600 block uppercase font-sans font-bold">Calculated Takt Time</span>
                <span className="text-base font-black text-blue-700">{calculatedTaktTimeSec.toFixed(2)}s</span>
                <span className="text-[10px] text-slate-500 block font-sans">วินาทีต่อเครื่อง</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-emerald-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-emerald-600 block uppercase font-sans font-bold">Required Target UPH</span>
                <span className="text-base font-black text-emerald-700">{calculatedRequiredUph.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500 block font-sans">เครื่อง/ชั่วโมง</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Manpower Requirement Sizing */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                2. Manpower Requirement Sizing (คำนวณกำลังคน)
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold">
              MP = Work Content / TT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                ภาระงานรวมต่อตู้ (Work Content)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${workContentSec.toLocaleString()} man-sec`}
                  className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md font-mono font-bold text-slate-700"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                คำนวณจากผลรวม (MP × CT 23s) ทั้ง 8 สถานี
              </span>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                เผื่อความเหนื่อยล้า/ดีเลย์ (Allowance Factor)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="30"
                  value={operatorAllowancePercent}
                  onChange={(e) => setOperatorAllowancePercent(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800"
                />
                <span className="text-slate-400">%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                ค่ามาตรฐานอุตสาหกรรม 8% - 12%
              </span>
            </div>
          </div>

          {/* Results Box */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200 mt-4 font-mono">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2.5 rounded-lg border border-purple-100">
                <span className="text-[10px] text-slate-400 block uppercase font-sans">Theoretical Min MP</span>
                <span className="text-base font-bold text-slate-700">{theoreticalDlPerShift.toFixed(1)}</span>
                <span className="text-[10px] text-slate-500 block font-sans">คน/กะ (ไม่มี Allowance)</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-300">
                <span className="text-[10px] text-purple-700 block uppercase font-sans font-bold">Planned DL per Shift</span>
                <span className="text-base font-black text-purple-800">{adjustedDlPerShift}</span>
                <span className="text-[10px] text-slate-500 block font-sans">คน/กะ (รวม Allowance)</span>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-purple-200 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-500 block uppercase font-sans">Total DL (2 Shifts)</span>
                <span className="text-base font-bold text-purple-900">{totalAdjustedDlBothShifts}</span>
                <span className="text-[10px] text-slate-500 block font-sans">คน (ไม่รวม IDL)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Line Speed Reserve & Capacity */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                3. Speed Reserve & Line Capability
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-semibold">
              Design CT: 23 sec
            </span>
          </div>

          <div className="text-xs text-slate-600 space-y-2">
            <p>
              สายการผลิตถูกออกแบบที่ <strong>Cycle Time = 23 วินาที</strong> สามารถผลิตได้สูงสุดตามทฤษฎี (Theoretical Maximum Capacity) ที่:
            </p>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 font-mono text-emerald-900 flex items-center justify-between">
              <span>Max Theoretical UPH (3,600s / 23s):</span>
              <span className="text-base font-black">{(3600 / config.designCycleTimeSec).toFixed(1)} UPH</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Operating Speed Buffer:</span>
              <span className="font-mono font-bold text-emerald-700">{lineSpeedReserve.toFixed(1)}%</span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, lineSpeedReserve))}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-slate-400">
              ช่วงความเร็วที่เผื่อไว้ ({calculatedTaktTimeSec.toFixed(1)}s - 23s = {(calculatedTaktTimeSec - 23).toFixed(1)} วินาที/เครื่อง) รองรับการเปลี่ยนรุ่น เบรกพาเลท และปัญหา Micro-stop
            </p>
          </div>
        </div>

        {/* 4. Labor Cost & Productivity Economics */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                4. Labor Cost & Productivity Analysis
              </h3>
            </div>
            <span className="text-[11px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold">
              Cost / Unit
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                เงินเดือนเฉลี่ยพนักงาน DL (THB/เดือน)
              </label>
              <input
                type="number"
                step="500"
                value={targetDlSalary}
                onChange={(e) => setTargetDlSalary(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                เงินเดือนเฉลี่ยเจ้าหน้าที่ IDL (THB/เดือน)
              </label>
              <input
                type="number"
                step="1000"
                value={targetIdlSalary}
                onChange={(e) => setTargetIdlSalary(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-slate-800"
              />
            </div>
          </div>

          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-700">
              <span>งบค่าจ้างรวมรายเดือน (Monthly Payroll):</span>
              <span className="font-bold text-slate-900">
                {(totalMonthlyPayroll / 1000000).toFixed(2)} ล้านบาท
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-700">
              <span>ต้นทุนแรงงานทางตรงต่อเครื่อง (DL Cost/Unit):</span>
              <span className="font-bold text-blue-700">
                {dlLaborCostPerUnit.toFixed(1)} บาท/เครื่อง
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-bold border-t border-amber-200/80 pt-1.5">
              <span>ต้นทุนแรงงานรวมต่อเครื่อง (Total Labor Cost/Unit):</span>
              <span className="text-amber-800 text-sm">
                {totalLaborCostPerUnit.toFixed(1)} บาท/เครื่อง
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
