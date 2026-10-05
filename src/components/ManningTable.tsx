import React, { useState } from 'react';
import { StationData, IndirectLaborData, SpareLaborData, ProductionLineConfig, ShiftType } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Info, 
  HelpCircle, 
  Edit3, 
  Check, 
  Calculator, 
  Maximize2,
  TrendingUp,
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  Zap,
  Copy
} from 'lucide-react';

interface ManningTableProps {
  stations: StationData[];
  idlList: IndirectLaborData[];
  sparesList: SpareLaborData[];
  config: ProductionLineConfig;
  metrics: IEMetrics;
  onUpdateStation: (id: string, updates: Partial<StationData>) => void;
  onUpdateIDL: (id: string, stdMp: number, title?: string) => void;
  onUpdateSpare: (id: string, stdMp: number) => void;
  onUpdateConfig: (updates: Partial<ProductionLineConfig>) => void;
  onAddStation?: (shift: 'Shift-A' | 'Shift-B') => void;
  onDeleteStation?: (id: string) => void;
  onAddIDL?: () => void;
  onDeleteIDL?: (id: string) => void;
  onBatchUpdateUph?: (newUph: number) => void;
  onBatchUpdateCt?: (newCt: number) => void;
  onCopyShiftAtoB?: () => void;
}

export const ManningTable: React.FC<ManningTableProps> = ({
  stations,
  idlList,
  sparesList,
  config,
  metrics,
  onUpdateStation,
  onUpdateIDL,
  onUpdateSpare,
  onUpdateConfig,
  onAddStation,
  onDeleteStation,
  onAddIDL,
  onDeleteIDL,
  onBatchUpdateUph,
  onBatchUpdateCt,
  onCopyShiftAtoB,
}) => {
  const [shiftFilter, setShiftFilter] = useState<ShiftType>('combined');
  const [isEditing, setIsEditing] = useState<boolean>(true); // default to editable as requested!
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);

  // Batch tools state
  const [batchUphVal, setBatchUphVal] = useState<number>(config.targetUph);
  const [batchCtVal, setBatchCtVal] = useState<number>(config.designCycleTimeSec);
  const [showBatchTools, setShowBatchTools] = useState<boolean>(false);

  // Filter stations based on selected view
  const displayedStations = stations.filter((s) => {
    if (shiftFilter === 'A') return s.shift === 'Shift-A';
    if (shiftFilter === 'B') return s.shift === 'Shift-B';
    return true; // combined shows all rows in original order
  });

  const handleApplyBatchUph = () => {
    if (onBatchUpdateUph) {
      onBatchUpdateUph(batchUphVal);
    } else {
      stations.forEach((s) => {
        const newUpph = Math.round(batchUphVal / (s.stdMp || 1));
        const newOutput = Math.round((batchUphVal * config.netShiftHours) / (s.stdMp || 1));
        onUpdateStation(s.id, { uph: batchUphVal, upph: newUpph, outputPerShift: newOutput });
      });
      onUpdateConfig({ targetUph: batchUphVal });
    }
  };

  const handleApplyBatchCt = () => {
    if (onBatchUpdateCt) {
      onBatchUpdateCt(batchCtVal);
    } else {
      stations.forEach((s) => {
        onUpdateStation(s.id, { ct: batchCtVal });
      });
      onUpdateConfig({ designCycleTimeSec: batchCtVal });
    }
  };

  const isLineA = config.id === 'line-a';

  return (
    <div className="space-y-6">
      {/* Top Controller Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLineA ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">
                Standard Manning Table ({config.lineName})
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                isLineA ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {config.lineShortCode}-Line
              </span>
            </div>
            <p className="text-xs text-slate-500">
              แก้ไขตัวเลข STD MP, UPH, CT ได้โดยตรงในตาราง · ระบบคำนวณ UPPH, Output/shift และยอดกำลังคนให้อัตโนมัติ
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Shift Filter Controls */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setShiftFilter('combined')}
              className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                shiftFilter === 'combined'
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2 Shifts (A+B)
            </button>
            <button
              onClick={() => setShiftFilter('A')}
              className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                shiftFilter === 'A'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ A (Shift-A)
            </button>
            <button
              onClick={() => setShiftFilter('B')}
              className={`px-3 py-1.5 font-medium rounded-md transition-all ${
                shiftFilter === 'B'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              กะ B (Shift-B)
            </button>
          </div>

          {/* Batch Tools Toggle */}
          <button
            onClick={() => setShowBatchTools(!showBatchTools)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              showBatchTools
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>เครื่องมือแก้ไขแบบกลุ่ม (Batch Tools)</span>
          </button>

          {/* Formula Explanation Button */}
          <button
            onClick={() => setShowFormulaModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>สูตร IE</span>
          </button>
        </div>
      </div>

      {/* Batch Tools Drawer */}
      {showBatchTools && (
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 shadow-inner space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>เครื่องมืออัปเดตตัวเลขแบบรวดเร็ว (Quick Batch Editors):</span>
            </span>
            <button
              onClick={() => setShowBatchTools(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              ปิด (Hide)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <label className="font-semibold text-slate-700 block">
                1. อัปเดตเป้าหมาย UPH ทั้งไลน์:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="5"
                  value={batchUphVal}
                  onChange={(e) => setBatchUphVal(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded font-mono"
                />
                <button
                  onClick={handleApplyBatchUph}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-xs"
                >
                  ใช้กับทุกสถานี
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                จะคำนวณ UPPH และ Output/shift ของทุกสถานีให้อัตโนมัติ
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <label className="font-semibold text-slate-700 block">
                2. อัปเดต Cycle Time (CT) ทั้งไลน์:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="1"
                  value={batchCtVal}
                  onChange={(e) => setBatchCtVal(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-center font-bold border border-slate-300 rounded font-mono"
                />
                <button
                  onClick={handleApplyBatchCt}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium shadow-xs"
                >
                  ใช้กับทุกสถานี
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                จะอัปเดต Cycle Time และ Work Content ของทุกสถานี
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
              <label className="font-semibold text-slate-700 block">
                3. คัดลอกค่าจากกะ A ไปยังกะ B:
              </label>
              <div>
                <button
                  onClick={() => {
                    if (onCopyShiftAtoB) {
                      onCopyShiftAtoB();
                    } else {
                      // Mirror Shift A to Shift B
                      const shiftA = stations.filter((s) => s.shift === 'Shift-A');
                      shiftA.forEach((stA) => {
                        const stB = stations.find((s) => s.no === stA.no && s.shift === 'Shift-B');
                        if (stB) {
                          onUpdateStation(stB.id, {
                            stdMp: stA.stdMp,
                            uph: stA.uph,
                            ct: stA.ct,
                            upph: stA.upph,
                            outputPerShift: stA.outputPerShift,
                          });
                        }
                      });
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sync Shift-A ➔ Shift-B</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                ซิงค์ค่า STD MP, UPH, CT จากกะ A ไปยังกะ B เท่ากันทันที
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Industrial Table Container */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Title Bar */}
        <div className="bg-slate-50 border-b border-slate-300 px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                {config.lineName} · {config.model}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                Volume: {config.targetDailyOutput.toLocaleString()} เครื่อง/วัน
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded">
                {(config.targetDailyOutput * 26).toLocaleString()} เครื่อง/เดือน (26 วัน)
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600 font-mono">
              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                <span className="text-slate-400 font-sans">Daily Volume:</span>
                <input
                  type="number"
                  step="50"
                  value={config.targetDailyOutput}
                  onChange={(e) => onUpdateConfig({ targetDailyOutput: parseInt(e.target.value) || 0 })}
                  className="w-16 font-bold text-slate-900 border-none outline-none text-right font-mono"
                  title="แก้ไขยอดเป้าหมายการผลิตต่อวัน (Daily Volume)"
                />
                <span className="text-slate-400 font-sans">pcs/day</span>
              </div>

              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                <span className="text-slate-400 font-sans">Line UPH:</span>
                <input
                  type="number"
                  step="5"
                  value={config.targetUph}
                  onChange={(e) => onUpdateConfig({ targetUph: parseInt(e.target.value) || 0 })}
                  className="w-14 font-bold text-blue-700 border-none outline-none text-right font-mono"
                  title="แก้ไข UPH ทั้งไลน์"
                />
              </div>

              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                <span className="text-slate-400 font-sans">Design CT:</span>
                <input
                  type="number"
                  step="1"
                  value={config.designCycleTimeSec}
                  onChange={(e) => onUpdateConfig({ designCycleTimeSec: parseInt(e.target.value) || 0 })}
                  className="w-12 font-bold text-purple-700 border-none outline-none text-right font-mono"
                  title="แก้ไข Cycle Time"
                />
                <span className="text-slate-400 font-sans">s</span>
              </div>

              <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300">
                <span className="text-slate-400 font-sans">Net Shift:</span>
                <input
                  type="number"
                  step="0.5"
                  value={config.netShiftHours}
                  onChange={(e) => onUpdateConfig({ netShiftHours: parseFloat(e.target.value) || 0 })}
                  className="w-12 font-bold text-slate-800 border-none outline-none text-right font-mono"
                  title="แก้ไขชั่วโมงทำงานสุทธิต่อกะ"
                />
                <span className="text-slate-400 font-sans">h</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                stations.forEach((s) => {
                  const newUpph = Math.round(s.uph / (s.stdMp || 1));
                  const newOutput = Math.round((s.uph * config.netShiftHours) / (s.stdMp || 1));
                  onUpdateStation(s.id, { upph: newUpph, outputPerShift: newOutput });
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition-colors"
              title="คำนวณ UPPH และ Output/shift อัตโนมัติตามสูตร IE ให้กับทุกสถานี"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              <span>คำนวณสูตรอัตโนมัติ</span>
            </button>

            {onAddStation && (
              <button
                onClick={() => onAddStation('Shift-A')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                title="Add new workstation row"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มสถานีใหม่ (+ Row)</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300 text-slate-800 text-xs font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3 w-12 text-center border-r border-slate-200">No.</th>
                <th className="py-2.5 px-4 min-w-[260px] border-r border-slate-200">Detail</th>
                <th className="py-2.5 px-3 w-14 text-center border-r border-slate-200">Type</th>
                <th className="py-2.5 px-4 w-28 text-right border-r border-slate-200 bg-blue-50/40">
                  <div className="flex items-center justify-end gap-1 text-blue-900" title="Standard Manpower - คลิกเพื่อแก้ไข">
                    <span>STD MP ✎</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24 text-right border-r border-slate-200">
                  <div className="flex items-center justify-end gap-1" title="Units Per Hour - คลิกเพื่อแก้ไข">
                    <span>UPH ✎</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24 text-right border-r border-slate-200">
                  <div className="flex items-center justify-end gap-1" title="Cycle Time in seconds - คลิกเพื่อแก้ไข">
                    <span>CT (s) ✎</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24 text-right border-r border-slate-200 bg-slate-50/70">
                  <div className="flex items-center justify-end gap-1" title="Units Per Person Hour - คลิกเพื่อแก้ไข">
                    <span>UPPH ✎</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-28 text-right border-r border-slate-200">
                  <div className="flex items-center justify-end gap-1" title="Output per operator per shift - คลิกเพื่อแก้ไข">
                    <span>Output/sh ✎</span>
                  </div>
                </th>
                <th className="py-2.5 px-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {/* Direct Labor Stations */}
              {displayedStations.map((station, index) => {
                const isShiftA = station.shift === 'Shift-A';
                const isBottleneck = station.stdMp >= 60;

                return (
                  <tr
                    key={station.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                    }`}
                  >
                    <td className="py-2 px-3 text-center text-slate-500 font-sans border-r border-slate-200">
                      {isShiftA || shiftFilter !== 'combined' ? station.no : ''}
                    </td>

                    {/* Detail Name (Editable) */}
                    <td className="py-2 px-4 font-sans text-slate-800 border-r border-slate-200">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={station.name}
                          onChange={(e) => onUpdateStation(station.id, { name: e.target.value })}
                          className="w-full bg-transparent hover:bg-slate-100 focus:bg-white px-1.5 py-0.5 rounded font-medium border border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none"
                          title="คลิกเพื่อแก้ไขชื่อสถานี"
                        />
                        {station.linesCount === 2 && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded font-mono whitespace-nowrap">
                            2L
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-center border-r border-slate-200">
                      <span className="text-blue-700 font-semibold">{station.type}</span>
                    </td>

                    {/* STD MP (Editable Input) */}
                    <td className="py-2 px-3 text-right font-bold text-slate-900 border-r border-slate-200 bg-blue-50/30">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={station.stdMp}
                          onChange={(e) => {
                            const newMp = parseFloat(e.target.value) || 0;
                            const newUpph = Math.round(station.uph / (newMp || 1));
                            const newOutput = Math.round((station.uph * config.netShiftHours) / (newMp || 1));
                            onUpdateStation(station.id, {
                              stdMp: newMp,
                              upph: newUpph,
                              outputPerShift: newOutput,
                            });
                          }}
                          className={`w-16 px-1.5 py-0.5 text-right font-bold border rounded shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono ${
                            isBottleneck 
                              ? 'bg-amber-50 text-amber-900 border-amber-300' 
                              : 'bg-white text-blue-800 border-blue-300'
                          }`}
                          title="แก้ไขจำนวนคน STD MP"
                        />
                      </div>
                    </td>

                    {/* UPH (Editable Input) */}
                    <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-200">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="1"
                          value={station.uph}
                          onChange={(e) => {
                            const newUph = parseFloat(e.target.value) || 0;
                            const newUpph = Math.round(newUph / (station.stdMp || 1));
                            const newOutput = Math.round((newUph * config.netShiftHours) / (station.stdMp || 1));
                            onUpdateStation(station.id, {
                              uph: newUph,
                              upph: newUpph,
                              outputPerShift: newOutput,
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 text-right text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded bg-white font-mono"
                          title="แก้ไข UPH ประจำสถานี"
                        />
                      </div>
                    </td>

                    {/* CT (Editable Input) */}
                    <td className="py-2 px-3 text-right text-slate-700 border-r border-slate-200">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="1"
                          value={station.ct}
                          onChange={(e) => {
                            const newCt = parseFloat(e.target.value) || 0;
                            onUpdateStation(station.id, { ct: newCt });
                          }}
                          className="w-14 px-1.5 py-0.5 text-right text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded bg-white font-mono"
                          title="แก้ไข Cycle Time (วินาที)"
                        />
                      </div>
                    </td>

                    {/* UPPH (Directly Editable) */}
                    <td className="py-2 px-3 text-right text-slate-900 font-semibold border-r border-slate-200 bg-slate-50/40">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={station.upph}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            onUpdateStation(station.id, { upph: val });
                          }}
                          className="w-14 px-1.5 py-0.5 text-right font-bold text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded bg-white font-mono"
                          title="แก้ไข UPPH ประจำสถานี"
                        />
                      </div>
                    </td>

                    {/* Output/shift (Directly Editable) */}
                    <td className="py-2 px-3 text-right text-slate-800 border-r border-slate-200">
                      <div className="flex items-center justify-end">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={station.outputPerShift}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            onUpdateStation(station.id, { outputPerShift: val });
                          }}
                          className="w-16 px-1.5 py-0.5 text-right text-slate-800 border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded bg-white font-mono"
                          title="แก้ไข Output/shift"
                        />
                      </div>
                    </td>

                    {/* Row delete button */}
                    <td className="py-2 px-2 text-center">
                      {onDeleteStation && (
                        <button
                          onClick={() => onDeleteStation(station.id)}
                          className="text-slate-300 hover:text-red-600 p-0.5 transition-colors"
                          title="ลบสถานีนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total DL Subtotal Row */}
              <tr className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-300 text-slate-900">
                <td className="py-3 px-3 text-center border-r border-slate-200 font-sans"></td>
                <td className="py-3 px-4 font-sans border-r border-slate-200">
                  Total RF Production Line {config.lineShortCode}
                  {shiftFilter === 'A' && ' (Shift-A)'}
                  {shiftFilter === 'B' && ' (Shift-B)'}
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-200">
                  <span className="text-blue-700 font-bold">DL</span>
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-200 text-sm font-extrabold text-blue-900 bg-blue-100/60">
                  {shiftFilter === 'combined'
                    ? metrics.totalDLBothShifts
                    : metrics.totalDLPerShift}
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-200">
                  {config.targetUph}
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-200">
                  {config.designCycleTimeSec}
                </td>
                <td className="py-3 px-4 text-right border-r border-slate-200 bg-slate-200/50">
                  {shiftFilter === 'combined' ? 83 : Math.round(83 / 2)}
                </td>
                <td className="py-3 px-4 text-right border-r border-slate-200"></td>
                <td></td>
              </tr>

              {/* Indirect Labor (IDL) Section Header */}
              {idlList.map((idl) => (
                <tr key={idl.id} className="bg-white hover:bg-amber-50/20 transition-colors">
                  <td className="py-2 px-3 text-center border-r border-slate-200"></td>
                  <td className="py-2 px-4 font-sans text-slate-700 border-r border-slate-200">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={idl.title}
                        onChange={(e) => onUpdateIDL(idl.id, idl.stdMp, e.target.value)}
                        className="bg-transparent hover:bg-slate-100 px-1 py-0.5 rounded font-medium border border-transparent focus:border-amber-400 focus:bg-white"
                      />
                      <span className="text-[11px] text-slate-400 font-normal truncate">({idl.thaiTitle})</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-200">
                    <span className="text-amber-700 font-semibold">{idl.type}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 border-r border-slate-200 bg-amber-50/30">
                    <div className="flex items-center justify-end">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={idl.stdMp}
                        onChange={(e) => onUpdateIDL(idl.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 text-right font-bold text-amber-800 border border-amber-300 rounded bg-white shadow-2xs font-mono"
                        title="แก้ไขจำนวนคน IDL"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                  <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                  <td className="py-2 px-4 text-right border-r border-slate-200 bg-slate-50/40"></td>
                  <td className="py-2 px-4 text-right border-r border-slate-200"></td>
                  <td className="py-2 px-2 text-center">
                    {onDeleteIDL && (
                      <button
                        onClick={() => onDeleteIDL(idl.id)}
                        className="text-slate-300 hover:text-red-600 p-0.5"
                        title="ลบแถว IDL นี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {/* SUM Total IDL */}
              <tr className="bg-amber-50/60 font-bold border-t border-b border-amber-200 text-slate-900">
                <td className="py-2.5 px-3 text-center border-r border-slate-200 font-sans"></td>
                <td className="py-2.5 px-4 font-sans border-r border-slate-200 flex items-center justify-between">
                  <span>SUM Total</span>
                  {onAddIDL && (
                    <button
                      onClick={onAddIDL}
                      className="text-[10px] text-amber-800 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> เพิ่ม IDL
                    </button>
                  )}
                </td>
                <td className="py-2.5 px-3 text-center border-r border-slate-200 text-amber-700">
                  IDL
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200 text-sm font-extrabold text-amber-900">
                  {metrics.totalIDL}
                </td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200"></td>
                <td className="py-2.5 px-3 text-right border-r border-slate-200"></td>
                <td className="py-2.5 px-4 text-right border-r border-slate-200"></td>
                <td className="py-2.5 px-4 text-right border-r border-slate-200"></td>
                <td></td>
              </tr>

              {/* Spare Rows (Editable) */}
              {sparesList.map((spare) => (
                <tr key={spare.id} className="bg-white hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 text-center border-r border-slate-200"></td>
                  <td className="py-2 px-4 font-sans text-slate-700 border-r border-slate-200">
                    <span className="font-medium">{spare.title}</span>
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-200">
                    <span className="text-blue-700 font-semibold">{spare.type}</span>
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 border-r border-slate-200 bg-slate-50/40">
                    <div className="flex items-center justify-end">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={spare.stdMp}
                        onChange={(e) => onUpdateSpare(spare.id, parseFloat(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 text-right font-bold text-emerald-700 border border-emerald-300 rounded bg-white shadow-2xs font-mono"
                        title="แก้ไขพนักงานสำรอง Spare Buffer"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                  <td className="py-2 px-3 text-right border-r border-slate-200"></td>
                  <td className="py-2 px-4 text-right border-r border-slate-200 bg-slate-50/40"></td>
                  <td className="py-2 px-4 text-right border-r border-slate-200"></td>
                  <td></td>
                </tr>
              ))}

              {/* Grand Total Headcount Row with EXACT YELLOW HIGHLIGHT */}
              <tr className="bg-slate-900 text-white font-bold text-sm border-t-2 border-slate-400">
                <td className="py-3 px-3 text-center border-r border-slate-800 font-sans"></td>
                <td className="py-3 px-4 font-sans border-r border-slate-800">
                  <span className="tracking-wide">
                    GRAND TOTAL LINE {config.lineShortCode} HEADCOUNT (DL + IDL + SPARE)
                  </span>
                </td>
                <td className="py-3 px-3 text-center border-r border-slate-800 font-mono text-xs text-slate-300">
                  ALL
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-800 bg-[#FFFF00] text-black font-extrabold text-base shadow-sm">
                  {metrics.grandTotalHeadcount}
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-800 text-slate-300">
                  {config.targetUph}
                </td>
                <td className="py-3 px-3 text-right border-r border-slate-800 text-slate-300">
                  {config.designCycleTimeSec}s
                </td>
                <td className="py-3 px-4 text-right border-r border-slate-800 bg-[#FFFF00] text-black font-bold"></td>
                <td className="py-3 px-4 text-right bg-[#FFFF00] text-black font-bold border-r border-slate-800"></td>
                <td className="bg-slate-900"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Notes and IE Explanations */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800">Summary {config.lineName}:</span>
              <span>DL Total: <strong>{metrics.totalDLBothShifts}</strong> MP ({((metrics.totalDLBothShifts / metrics.grandTotalHeadcount) * 100).toFixed(1)}%)</span>
              <span>·</span>
              <span>IDL Total: <strong>{metrics.totalIDL}</strong> MP ({((metrics.totalIDL / metrics.grandTotalHeadcount) * 100).toFixed(1)}%)</span>
              <span>·</span>
              <span>Spare Relief Buffer: <strong>{metrics.totalSpareBothShifts}</strong> MP</span>
              <span>·</span>
              <span>Grand Total: <strong className="text-slate-900 bg-yellow-200 px-1.5 py-0.5 rounded font-black">{metrics.grandTotalHeadcount}</strong> MP</span>
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              Takt Time: {metrics.taktTimeSec.toFixed(2)}s | Speed Buffer: {metrics.speedReservePercent.toFixed(1)}% | UPPH: {metrics.overallDLUPPH.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Dialog for Industrial Engineering Formula Explanations */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  สูตรและหลักการคำนวณวิศวกรรม IE ({config.lineName})
                </h3>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 pt-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-900 text-sm mb-1">1. Takt Time & UPH</h4>
                <p>
                  เวลาช่วงในการผลิตสินค้าแต่ละชิ้นตามความต้องการของลูกค้า
                </p>
                <div className="mt-1 font-mono bg-white p-2 rounded border border-blue-100 text-slate-800">
                  Takt Time = 3,600 วินาที / UPH = 3,600 / {config.targetUph} = <strong>{metrics.taktTimeSec.toFixed(2)} วินาที/เครื่อง</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. UPPH (Units Per Person Hour)</h4>
                <div className="mt-1 font-mono bg-white p-2 rounded border border-slate-200 text-slate-800">
                  Station UPPH = UPH / STD MP
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Output per Shift</h4>
                <div className="mt-1 font-mono bg-white p-2 rounded border border-slate-200 text-slate-800">
                  Output per Operator = (UPH × Net Shift Hours) / STD MP
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                ปิด (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
