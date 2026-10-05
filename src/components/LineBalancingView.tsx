import React, { useState } from 'react';
import { StationData, ProductionLineConfig } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  BarChart3, 
  AlertTriangle, 
  Zap, 
  PieChart, 
  Sliders, 
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Clock,
  Edit3
} from 'lucide-react';

interface LineBalancingViewProps {
  stations: StationData[];
  config: ProductionLineConfig;
  metrics: IEMetrics;
  onUpdateStation?: (id: string, updates: Partial<StationData>) => void;
}

export const LineBalancingView: React.FC<LineBalancingViewProps> = ({
  stations,
  config,
  metrics,
  onUpdateStation,
}) => {
  const [chartMode, setChartMode] = useState<'workContent' | 'manpower' | 'upph'>('workContent');
  const [isEditingInBalancing, setIsEditingInBalancing] = useState<boolean>(false);

  // Filter to Shift A for station balancing metrics (since Shift B is symmetric)
  const shiftAStations = stations.filter((s) => s.shift === 'Shift-A');

  // Total DL per shift
  const totalDL = shiftAStations.reduce((sum, s) => sum + s.stdMp, 0);

  // Calculate work content per station
  const stationWorkloads = shiftAStations.map((s) => {
    const workContentSec = s.stdMp * s.ct;
    const workContentMin = workContentSec / 60;
    const mpPercent = (s.stdMp / (totalDL || 1)) * 100;
    const isBottleneck = s.stdMp >= 60;
    const isSubline2 = s.linesCount === 2;

    return {
      id: s.id,
      no: s.no,
      name: s.name.replace(' (Shift-A)', ''),
      thaiName: s.thaiName.replace(' (กะ A)', ''),
      stdMp: s.stdMp,
      ct: s.ct,
      uph: s.uph,
      upph: s.upph,
      workContentSec,
      workContentMin,
      mpPercent,
      isBottleneck,
      isSubline2,
      outputPerShift: s.outputPerShift,
    };
  });

  const maxWorkContent = Math.max(...stationWorkloads.map((s) => s.workContentSec));
  const maxMp = Math.max(...stationWorkloads.map((s) => s.stdMp));
  const maxUpph = Math.max(...stationWorkloads.map((s) => s.upph));

  const handleUpdateStationData = (stNo: number, updates: Partial<StationData>) => {
    if (!onUpdateStation) return;
    const stShiftA = stations.find((s) => s.no === stNo && s.shift === 'Shift-A');
    const stShiftB = stations.find((s) => s.no === stNo && s.shift === 'Shift-B');

    if (stShiftA) onUpdateStation(stShiftA.id, updates);
    if (stShiftB) onUpdateStation(stShiftB.id, updates);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI summary */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                Line Balancing & Yamazumi Chart ({config.lineName})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              วิเคราะห์ภาระงาน (Work Content), ความสมดุลของกำลังคน (Manpower Balancing) และสถานีที่เป็นคอขวด (Bottleneck Stations)
            </p>
          </div>

          {/* Chart Display Mode Selector & Edit Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditingInBalancing(!isEditingInBalancing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                isEditingInBalancing
                  ? 'bg-blue-50 border-blue-400 text-blue-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>{isEditingInBalancing ? 'ปิดโหมดแก้ไข' : 'แก้ไข MP & CT ตรงนี้'}</span>
            </button>

            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setChartMode('workContent')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  chartMode === 'workContent'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Work Content (man-sec)
              </button>
              <button
                onClick={() => setChartMode('manpower')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  chartMode === 'manpower'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manpower (คน/สถานี)
              </button>
              <button
                onClick={() => setChartMode('upph')}
                className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                  chartMode === 'upph'
                    ? 'bg-white text-blue-700 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Station UPPH
              </button>
            </div>
          </div>
        </div>

        {/* 4 Line Balancing KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Total Work Content / Unit
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-slate-900 font-mono">
                {metrics.totalWorkContentSecondsPerUnit.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">man-sec</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ≈ {metrics.totalWorkContentMinutesPerUnit.toFixed(1)} นาที/เครื่อง ({metrics.totalWorkContentHoursPerUnit.toFixed(2)} man-hours)
            </p>
          </div>

          <div className="bg-blue-50/60 p-3.5 rounded-xl border border-blue-200">
            <span className="text-[11px] font-medium text-blue-700 uppercase tracking-wider block">
              Takt Time vs Design CT
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-blue-900 font-mono">
                {metrics.taktTimeSec.toFixed(1)}s
              </span>
              <span className="text-xs text-blue-600">/ CT {config.designCycleTimeSec}s</span>
            </div>
            <p className="text-[11px] text-blue-700 mt-1">
              Speed Buffer: +{metrics.speedReservePercent.toFixed(1)}% (เผื่อ OEE & Micro-stops)
            </p>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
              Line Balancing Efficiency
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-emerald-800 font-mono">
                {metrics.lineBalanceEfficiencyPercent.toFixed(1)}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1">
              Balance Delay (Loss): {metrics.balanceDelayPercent.toFixed(1)}%
            </p>
          </div>

          <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200">
            <span className="text-[11px] font-medium text-amber-800 uppercase tracking-wider block">
              Top 3 Labor Consuming Stations
            </span>
            <div className="flex items-baseline gap-1 mt-1 font-mono text-base font-bold text-amber-900">
              #2, #5, #3
            </div>
            <p className="text-[11px] text-amber-800 mt-1">
              กินกำลังคนรวมกัน {((stationWorkloads.filter(s => [2, 3, 5].includes(s.no)).reduce((acc, c) => acc + c.stdMp, 0) / (totalDL || 1)) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Visual Yamazumi Chart Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {chartMode === 'workContent' && 'Yamazumi Work Content per Unit (วินาที-คน ต่อเครื่อง)'}
            {chartMode === 'manpower' && 'Manpower Allocation per Station (จำนวนคนต่อสถานีในกะเดียว)'}
            {chartMode === 'upph' && 'Station UPPH Comparison (ผลผลิตต่อคนต่อชั่วโมง)'}
          </h3>
          <span className="text-xs text-slate-400">
            {chartMode === 'workContent' && 'Work Content = STD MP × Cycle Time'}
            {chartMode === 'manpower' && `Total DL = ${totalDL} คน/กะ (${totalDL * 2} รวม 2 กะ)`}
            {chartMode === 'upph' && 'UPPH = UPH / STD MP'}
          </span>
        </div>

        {/* Bar Chart Representation with Optional Direct Inputs */}
        <div className="space-y-4">
          {stationWorkloads.map((station) => {
            let barValue = station.workContentSec;
            let maxVal = maxWorkContent;
            let displayLabel = `${station.workContentSec.toLocaleString()} man-sec (${station.workContentMin.toFixed(1)} min)`;
            let barColor = 'bg-blue-600';

            if (chartMode === 'manpower') {
              barValue = station.stdMp;
              maxVal = maxMp;
              displayLabel = `${station.stdMp} คน (${station.mpPercent.toFixed(1)}% ของ DL)`;
              barColor = station.isBottleneck ? 'bg-amber-500' : 'bg-blue-500';
            } else if (chartMode === 'upph') {
              barValue = station.upph;
              maxVal = maxUpph;
              displayLabel = `${station.upph} UPPH (Output/shift: ${station.outputPerShift})`;
              barColor = 'bg-emerald-600';
            }

            const percentWidth = Math.max(5, (barValue / (maxVal || 1)) * 100);

            return (
              <div key={station.no} className="group p-2 rounded-lg hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center font-mono text-[11px]">
                      #{station.no}
                    </span>
                    <span className="font-semibold text-slate-800">{station.name}</span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline">({station.thaiName})</span>
                    {station.isBottleneck && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Bottleneck
                      </span>
                    )}
                    {station.isSubline2 && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">
                        2 Sub-lines
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {isEditingInBalancing ? (
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                          <span className="text-[10px] text-slate-400 font-sans">MP:</span>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            value={station.stdMp}
                            onChange={(e) => {
                              const newMp = parseFloat(e.target.value) || 0;
                              const newUpph = Math.round(station.uph / (newMp || 1));
                              const newOutput = Math.round((station.uph * config.netShiftHours) / (newMp || 1));
                              handleUpdateStationData(station.no, { stdMp: newMp, upph: newUpph, outputPerShift: newOutput });
                            }}
                            className="w-12 text-right font-bold text-blue-700 outline-none"
                            title="แก้ไขจำนวนคน"
                          />
                        </div>
                        <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                          <span className="text-[10px] text-slate-400 font-sans">CT:</span>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            value={station.ct}
                            onChange={(e) => {
                              const newCt = parseFloat(e.target.value) || 0;
                              handleUpdateStationData(station.no, { ct: newCt });
                            }}
                            className="w-10 text-right font-bold text-purple-700 outline-none"
                            title="แก้ไข Cycle Time"
                          />
                          <span className="text-[10px] text-slate-400 font-sans">s</span>
                        </div>
                      </div>
                    ) : (
                      <div className="font-mono text-slate-700 font-semibold text-xs">
                        {displayLabel}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-6 bg-slate-100 rounded-md overflow-hidden relative border border-slate-200/60">
                  <div
                    className={`h-full ${barColor} transition-all duration-300 rounded-r-sm flex items-center justify-end px-2`}
                    style={{ width: `${percentWidth}%` }}
                  >
                    {percentWidth > 20 && (
                      <span className="text-[10px] font-bold text-white font-mono">
                        {station.mpPercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Process Distribution & Bottleneck Analysis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Manpower Percentage Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              สัดส่วนกำลังคนตามสถานี (Manpower Distribution)
            </h3>
          </div>

          <div className="space-y-3">
            {stationWorkloads.map((st) => (
              <div key={st.no} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"></span>
                  <span className="font-medium text-slate-800 truncate">
                    #{st.no} {st.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-slate-600 flex-shrink-0">
                  <span>{st.stdMp} คน/กะ</span>
                  <span className="font-bold text-slate-900 w-12 text-right">
                    {st.mpPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-800 font-mono">
            <span>รวม Direct Labor (Shift A)</span>
            <span className="text-blue-700 font-extrabold">{totalDL} คน (100%)</span>
          </div>
        </div>

        {/* Industrial Engineering Insights & Kaizen Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-900">
                ข้อเสนอแนะเชิงวิศวกรรม IE (IE Recommendations)
              </h3>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200">
                <span className="font-bold text-amber-900 block mb-0.5">
                  1. จัดการจุดคอขวดสถานี #2 Inner Box
                </span>
                เนื่องจากเป็นจุดที่มีกำลังคนสูงสุด ควรพิจารณาทำระบบ Auto Trimming Router และ Ultrasonic Horn Welding อัตโนมัติ สามารถลดกำลังคนได้ 6-8 คน/กะ
              </div>

              <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200">
                <span className="font-bold text-blue-900 block mb-0.5">
                  2. ปรับปรุงการจัดสายการประกอบ #5 Assembly Line
                </span>
                ประยุกต์ใช้หลักการ Motion Economy ในการเดินสายไฟ (Wire Harness) และติดตั้ง Automatic Screw Feeder เพื่อเพิ่ม UPPH
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">
                  3. Line Speed Reserve Margin ที่ {metrics.speedReservePercent.toFixed(1)}%
                </span>
                Cycle Time เครื่องจักรอยู่ที่ {config.designCycleTimeSec} วินาที เร็วกว่า Takt Time ({metrics.taktTimeSec.toFixed(1)}s) บ่งบอกว่ามีศักยภาพในการเร่งกำลังผลิต (Ramp-up) ได้ทันทีเมื่อต้องการ
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              มาตรฐานการคำนวณตามหลัก IE สากล
            </span>
            <span>{config.lineName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
