import React from 'react';
import { ProductionLineConfig, ActiveLine } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Factory, 
  Clock, 
  Users, 
  TrendingUp, 
  Gauge, 
  Download, 
  Printer, 
  RotateCcw,
  Sparkles,
  GitCompare,
  Layers
} from 'lucide-react';

interface HeaderProps {
  activeLine: ActiveLine;
  setActiveLine: (line: ActiveLine) => void;
  config: ProductionLineConfig;
  metrics: IEMetrics;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExportCSV: () => void;
  onOpenReport: () => void;
  onReset: () => void;
  isModified: boolean;
  totalPlantHeadcount?: number;
  totalPlantDailyOutput?: number;
  volumeA?: number;
  volumeB?: number;
  modelA?: string;
  modelB?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeLine,
  setActiveLine,
  config,
  metrics,
  activeTab,
  setActiveTab,
  onExportCSV,
  onOpenReport,
  onReset,
  isModified,
  totalPlantHeadcount = 1463,
  totalPlantDailyOutput = 5100,
  volumeA = 2600,
  volumeB = 2500,
  modelA = 'Model A (BM350)',
  modelB = 'Model B (BM400)',
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard Summary 1', thaiLabel: 'แดชบอร์ดสรุปภาพรวมผู้จัดการ' },
    { id: 'forecast', label: 'Volume Forecast (TT/CT/MP)', thaiLabel: 'คาดการณ์กำลังคน & เวลา TT, CT แม่นยำ' },
    { id: 'plan', label: 'Model Production Plan', thaiLabel: 'แผนการผลิตแต่ละ Model (แก้ไข/บันทึก)' },
    { id: 'manning', label: 'Master Manning Table', thaiLabel: 'ตารางกำลังคนมาตรฐาน (แก้ไขได้)' },
    { id: 'balancing', label: 'Line Balancing & Yamazumi', thaiLabel: 'การบาลานซ์ & วิเคราะห์คอขวด' },
    { id: 'calculator', label: 'IE Calculator', thaiLabel: 'เครื่องคิดเลขวิศวกรรม IE' },
    { id: 'kaizen', label: 'Kaizen & What-If Studio', thaiLabel: 'จำลองปรับปรุงกำลังคน' },
    { id: 'process', label: 'Process Breakdown', thaiLabel: 'ผังกระบวนการผลิต' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Topmost Production Line Selector Bar */}
      <div className="bg-slate-950 px-4 sm:px-6 lg:px-8 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Factory className="w-3.5 h-3.5 text-blue-400" />
            <span>เลือกสายการผลิต (Select Line):</span>
          </span>

          <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveLine('line-a')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                activeLine === 'line-a'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300"></span>
              <span>Line A (A-Line)</span>
              <span className="text-[10px] opacity-75 font-mono">UPH 120</span>
            </button>

            <button
              onClick={() => setActiveLine('line-b')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                activeLine === 'line-b'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              <span>Line B (B-Line)</span>
              <span className="text-[10px] opacity-75 font-mono">UPH 110 (ต้นฉบับ)</span>
            </button>

            <button
              onClick={() => setActiveLine('plant-overview')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                activeLine === 'plant-overview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCompare className="w-3 h-3 text-purple-300" />
              <span>Plant Overview</span>
              <span className="text-[10px] opacity-75 font-mono">เปรียบเทียบ A + B</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-mono hidden md:flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>Model A: <strong className="text-blue-300">{volumeA.toLocaleString()}</strong>/day</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Model B: <strong className="text-emerald-300">{volumeB.toLocaleString()}</strong>/day</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>Total Plant Volume: <strong className="text-white font-bold">{totalPlantDailyOutput.toLocaleString()}</strong> pcs/day</span>
          <span className="text-slate-600">·</span>
          <span>Total MP: <strong className="text-yellow-400">{totalPlantHeadcount}</strong></span>
        </div>
      </div>

      {/* Main Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-inner flex-shrink-0 font-bold ${
              activeLine === 'line-a' ? 'bg-blue-600' : activeLine === 'line-b' ? 'bg-emerald-600' : 'bg-purple-600'
            }`}>
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  {activeLine === 'plant-overview'
                    ? 'Plant Overview: Refrigerator Model A (2,600/day) & Model B (2,500/day) Total Volume'
                    : `${config.lineName} · ${config.model} · Volume ${config.targetDailyOutput.toLocaleString()} เครื่อง/วัน (UPH ${config.targetUph})`}
                </h1>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  activeLine === 'line-a'
                    ? 'bg-blue-900/80 text-blue-200 border-blue-700/60'
                    : activeLine === 'line-b'
                    ? 'bg-emerald-900/80 text-emerald-200 border-emerald-700/60'
                    : 'bg-purple-900/80 text-purple-200 border-purple-700/60'
                }`}>
                  {activeLine === 'line-a' ? 'Line A Standard' : activeLine === 'line-b' ? 'Line B Standard' : 'Plant Combined'}
                </span>
                {isModified && (
                  <span className="text-[11px] font-medium bg-amber-900/60 text-amber-200 border border-amber-700/50 px-2 py-0.5 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    มีการแก้ไขตัวเลข (Edited)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Industrial Engineering Manning & Capacity Management System · Refrigerator Plant
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isModified && (
              <button
                onClick={onReset}
                title="Reset to Original Baseline Sheet"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตค่าเดิม</span>
              </button>
            )}
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน (Print)</span>
            </button>
            <button
              onClick={onExportCSV}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-md transition-colors shadow-sm ${
                activeLine === 'line-a' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก Excel / CSV</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar (only when viewing single line) */}
        {activeLine !== 'plant-overview' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 mt-2 border-t border-slate-800/80">
            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400" />
                <span>Total Headcount</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-yellow-400">{metrics.grandTotalHeadcount}</span>
                <span className="text-[10px] text-slate-400">คน (MP)</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-cyan-400" />
                <span>Direct Labor (DL)</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-white">{metrics.totalDLBothShifts}</span>
                <span className="text-[10px] text-slate-400">({metrics.totalDLPerShift}/shift)</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-amber-400" />
                <span>IDL & Spare Buffer</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-amber-300">{metrics.totalIDL + metrics.totalSpareBothShifts}</span>
                <span className="text-[10px] text-slate-400">(IDL {metrics.totalIDL} + Sp {metrics.totalSpareBothShifts})</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-emerald-400" />
                <span>Target UPH</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-white">{config.targetUph}</span>
                <span className="text-[10px] text-emerald-400">pcs/hr</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <span>CT vs Takt Time</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-purple-300">{config.designCycleTimeSec}s</span>
                <span className="text-[10px] text-slate-400">/ TT {metrics.taktTimeSec.toFixed(1)}s</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded px-2.5 py-1.5 border border-slate-700/40">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span>Line DL UPPH</span>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-bold text-green-300">{metrics.overallDLUPPH.toFixed(3)}</span>
                <span className="text-[10px] text-slate-400">unit/man-h</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <nav className="flex space-x-1 overflow-x-auto py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors flex flex-col items-start ${
                activeTab === tab.id
                  ? activeLine === 'line-a'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : activeLine === 'line-b'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-75">{tab.thaiLabel}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
