import React, { useState, useEffect } from 'react';
import { ProductionLineConfig, ModelVolumeItem } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { 
  Package, 
  TrendingUp, 
  Layers, 
  Gauge, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ArrowRight, 
  Sliders, 
  RefreshCw, 
  DollarSign,
  PieChart,
  Boxes,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  HelpCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Check,
  Tag,
  FileText,
  Building,
  Target
} from 'lucide-react';

interface VolumeModelManagementProps {
  modelVolumes: ModelVolumeItem[];
  onAddModelVolume: (item: Omit<ModelVolumeItem, 'id'>) => void;
  onUpdateModelVolume: (id: string, updates: Partial<ModelVolumeItem>) => void;
  onDeleteModelVolume: (id: string) => void;
  onResetModelVolumes?: () => void;
  lineAConfig: ProductionLineConfig;
  lineAMetrics: IEMetrics;
  lineBConfig: ProductionLineConfig;
  lineBMetrics: IEMetrics;
  onUpdateConfigA: (updates: Partial<ProductionLineConfig>) => void;
  onUpdateConfigB: (updates: Partial<ProductionLineConfig>) => void;
  onBatchUpdateUphA?: (newUph: number) => void;
  onBatchUpdateUphB?: (newUph: number) => void;
  onSelectLine: (lineId: 'line-a' | 'line-b') => void;
}

export const VolumeModelManagement: React.FC<VolumeModelManagementProps> = ({
  modelVolumes,
  onAddModelVolume,
  onUpdateModelVolume,
  onDeleteModelVolume,
  onResetModelVolumes,
  lineAConfig,
  lineAMetrics,
  lineBConfig,
  lineBMetrics,
  onUpdateConfigA,
  onUpdateConfigB,
  onBatchUpdateUphA,
  onBatchUpdateUphB,
  onSelectLine,
}) => {
  const [activePreset, setActivePreset] = useState<string>('custom');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // New model state
  const [newModelName, setNewModelName] = useState<string>('');
  const [newModelCode, setNewModelCode] = useState<string>('');
  const [newModelDesc, setNewModelDesc] = useState<string>('');
  const [newModelLine, setNewModelLine] = useState<'line-a' | 'line-b'>('line-b');
  const [newModelVolume, setNewModelVolume] = useState<number>(500);
  const [newModelMarket, setNewModelMarket] = useState<string>('ตลาดในประเทศ (Domestic)');
  const [newModelMonth, setNewModelMonth] = useState<string>('ตุลาคม 2026');
  const [newModelStatus, setNewModelStatus] = useState<'Active' | 'Planned' | 'Ramp-up' | 'Phase-out'>('Active');
  const [newModelLotSize, setNewModelLotSize] = useState<number>(500);
  const [newModelNotes, setNewModelNotes] = useState<string>('');

  // Edit inline buffer state
  const [editBuffer, setEditBuffer] = useState<Partial<ModelVolumeItem>>({});

  // Auto-clear notice after 3s
  useEffect(() => {
    if (saveNotice) {
      const timer = setTimeout(() => setSaveNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [saveNotice]);

  const triggerSaveNotice = (msg: string) => {
    setSaveNotice(msg);
  };

  // Dynamic calculations from modelVolumes
  const modelsA = modelVolumes.filter((m) => m.line === 'line-a');
  const modelsB = modelVolumes.filter((m) => m.line === 'line-b');

  const volumeA = modelsA.reduce((sum, m) => sum + (Number(m.dailyVolume) || 0), 0);
  const volumeB = modelsB.reduce((sum, m) => sum + (Number(m.dailyVolume) || 0), 0);
  const totalDailyVolume = volumeA + volumeB;

  const monthlyVolumeA = volumeA * 26;
  const monthlyVolumeB = volumeB * 26;
  const totalMonthlyVolume = totalDailyVolume * 26;

  const annualVolumeA = monthlyVolumeA * 12;
  const annualVolumeB = monthlyVolumeB * 12;
  const totalAnnualVolume = totalMonthlyVolume * 12;

  // Mix shares
  const shareA = totalDailyVolume > 0 ? (volumeA / totalDailyVolume) * 100 : 0;
  const shareB = totalDailyVolume > 0 ? (volumeB / totalDailyVolume) * 100 : 0;

  // Operating net hours
  const netHoursA = (lineAConfig.workingShiftsPerDay || 2) * (lineAConfig.netShiftHours || 10.5);
  const netHoursB = (lineBConfig.workingShiftsPerDay || 2) * (lineBConfig.netShiftHours || 10.5);

  // Required UPH Formula: Ceil(Daily Volume / Total Net Operating Hours per Day)
  const reqUphA = netHoursA > 0 ? Math.ceil(volumeA / netHoursA) : lineAConfig.targetUph;
  const reqUphB = netHoursB > 0 ? Math.ceil(volumeB / netHoursB) : lineBConfig.targetUph;

  // Actual capacity based on current line speed (UPH)
  const actualDailyCapA = lineAConfig.targetUph * netHoursA;
  const actualDailyCapB = lineBConfig.targetUph * netHoursB;
  const totalActualDailyCap = actualDailyCapA + actualDailyCapB;

  // Capacity fulfillment (%)
  const fulfillmentA = volumeA > 0 ? Math.min(200, Math.round((actualDailyCapA / volumeA) * 1000) / 10) : 100;
  const fulfillmentB = volumeB > 0 ? Math.min(200, Math.round((actualDailyCapB / volumeB) * 1000) / 10) : 100;

  const gapDailyA = actualDailyCapA - volumeA;
  const gapDailyB = actualDailyCapB - volumeB;

  // Sync helpers
  const handleSyncUphA = () => {
    if (onBatchUpdateUphA) {
      onBatchUpdateUphA(reqUphA);
    } else {
      onUpdateConfigA({ targetUph: reqUphA });
    }
    triggerSaveNotice(`✓ ซิงค์ความเร็ว Line A เป็น ${reqUphA} UPH และบันทึกอัตโนมัติแล้ว`);
  };

  const handleSyncUphB = () => {
    if (onBatchUpdateUphB) {
      onBatchUpdateUphB(reqUphB);
    } else {
      onUpdateConfigB({ targetUph: reqUphB });
    }
    triggerSaveNotice(`✓ ซิงค์ความเร็ว Line B เป็น ${reqUphB} UPH และบันทึกอัตโนมัติแล้ว`);
  };

  const handleSyncAllUph = () => {
    handleSyncUphA();
    handleSyncUphB();
    triggerSaveNotice(`✓ ซิงค์ความเร็ว UPH ทั้ง Line A (${reqUphA}) และ Line B (${reqUphB}) ให้ผลิตได้ 100% พร้อมบันทึกอัตโนมัติแล้ว`);
  };

  // Add new model submit
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || newModelVolume <= 0) return;

    onAddModelVolume({
      name: newModelName.trim(),
      modelCode: newModelCode.trim() || newModelName.trim().slice(0, 8).toUpperCase(),
      description: newModelDesc.trim() || `แผนผลิตโมเดลสำหรับ ${newModelLine === 'line-a' ? 'Line A' : 'Line B'}`,
      line: newModelLine,
      dailyVolume: Number(newModelVolume),
      isMain: false,
      planMonth: newModelMonth || 'ตุลาคม 2026',
      customerOrMarket: newModelMarket || 'ตลาดในประเทศ',
      status: newModelStatus || 'Active',
      targetLotSize: Number(newModelLotSize) || 500,
      notes: newModelNotes || '',
    });

    triggerSaveNotice(`✓ เพิ่มแผนผลิต "${newModelName.trim()}" (${newModelVolume.toLocaleString()} pcs/day) และบันทึกอัตโนมัติแล้ว`);

    // Reset form
    setNewModelName('');
    setNewModelCode('');
    setNewModelDesc('');
    setNewModelVolume(500);
    setNewModelNotes('');
    setShowAddForm(false);
  };

  // Quick preset apply
  const handleApplyPreset = (volA: number, volB: number, presetId: string, label: string) => {
    setActivePreset(presetId);
    const mainA = modelVolumes.find((m) => m.line === 'line-a' && m.isMain) || modelVolumes.find((m) => m.line === 'line-a');
    const mainB = modelVolumes.find((m) => m.line === 'line-b' && m.isMain) || modelVolumes.find((m) => m.line === 'line-b');

    if (mainA) {
      onUpdateModelVolume(mainA.id, { dailyVolume: volA });
    }
    if (mainB) {
      onUpdateModelVolume(mainB.id, { dailyVolume: volB });
    }
    triggerSaveNotice(`✓ ปรับใช้ชุดแผนผลิต "${label}" และบันทึกอัตโนมัติแล้ว`);
  };

  // Start inline editing
  const handleStartEdit = (model: ModelVolumeItem) => {
    setEditingId(model.id);
    setEditBuffer({
      name: model.name,
      modelCode: model.modelCode,
      description: model.description,
      dailyVolume: model.dailyVolume,
      line: model.line,
      planMonth: model.planMonth || 'ตุลาคม 2026',
      customerOrMarket: model.customerOrMarket || 'ตลาดในประเทศ',
      status: model.status || 'Active',
      targetLotSize: model.targetLotSize || 500,
      notes: model.notes || '',
    });
  };

  const handleSaveEdit = (id: string) => {
    if (editBuffer) {
      onUpdateModelVolume(id, {
        ...editBuffer,
        dailyVolume: Number(editBuffer.dailyVolume) || 0,
      });
      triggerSaveNotice(`✓ แก้ไขข้อมูลแผนการผลิตและบันทึกอัตโนมัติลงใน Web แล้ว`);
    }
    setEditingId(null);
    setEditBuffer({});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditBuffer({});
  };

  const handleDeleteWithNotice = (id: string, name: string) => {
    onDeleteModelVolume(id);
    triggerSaveNotice(`✓ ลบแผนผลิต "${name}" และบันทึกอัตโนมัติแล้ว`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl shadow-md">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Production Plan & Volume By Model (แผนการผลิตและยอดรายโมเดล)
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>บันทึกอัตโนมัติ (Auto-Saved on Web)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              แก้ไขยอดผลิต, สเปก, แผนงานรายเดือน, ตลาดส่งออก หรือเพิ่ม/ลบ Model ได้อย่างอิสระ ทุกข้อมูลจะถูกบันทึกอัตโนมัติและผูกสูตรคำนวณ IE ต่อเนื่องตลอดเวลา
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFormulaModal(!showFormulaModal)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all border border-slate-300"
            title="ดูสูตรคณิตศาสตร์และตรรกะการคำนวณ IE"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            <span>{showFormulaModal ? 'ซ่อนสูตรคำนวณ' : 'แสดงสูตรคำนวณ IE'}</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ เพิ่มแผนผลิต Model ใหม่</span>
          </button>

          <button
            onClick={handleSyncAllUph}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            title="ปรับความเร็ว UPH ของสายการผลิตให้ครบตามยอด Volume ปัจจุบัน 100%"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ซิงค์ UPH ให้ครบ 100%</span>
          </button>
        </div>
      </div>

      {/* Auto-Save Notice Toast */}
      {saveNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{saveNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-600 bg-white/80 px-2 py-0.5 rounded border border-emerald-200">
            Auto-Saved
          </span>
        </div>
      )}

      {/* IE Formula Explanatory Box (Collapsible) */}
      {showFormulaModal && (
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-xl border border-slate-700 space-y-3 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white tracking-wide">
                สูตรคำนวณทางวิศวกรรมอุตสาหการ (IE Formulas & Logic) ที่ผูกอยู่บนหน้านี้
              </h4>
            </div>
            <button
              onClick={() => setShowFormulaModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-emerald-400 font-bold block mb-1 font-sans">1. Daily Line Volume</span>
              <p className="text-slate-300 text-[11px] mb-1">
                Volume รวมของสายการผลิต A หรือ B
              </p>
              <code className="text-yellow-300 block text-[11px] bg-black/40 p-1.5 rounded">
                Vol_Line = ∑(Daily Volume ของทุก Model ใน Line นั้น)
              </code>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-blue-400 font-bold block mb-1 font-sans">2. Monthly & Annual Volume</span>
              <p className="text-slate-300 text-[11px] mb-1">
                อิง 26 วันทำงาน/เดือน และ 12 เดือน/ปี
              </p>
              <code className="text-yellow-300 block text-[11px] bg-black/40 p-1.5 rounded">
                Monthly = Daily Vol × 26 วัน<br/>
                Annual = Monthly Vol × 12 เดือน
              </code>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-purple-400 font-bold block mb-1 font-sans">3. Required UPH Formula</span>
              <p className="text-slate-300 text-[11px] mb-1">
                ความเร็วชิ้นงานต่อชั่วโมงที่ต้องเดิน
              </p>
              <code className="text-yellow-300 block text-[11px] bg-black/40 p-1.5 rounded">
                Net_Hours = Shifts × Net_Shift_Hours (2 × 10.5 = 21h)<br/>
                Req_UPH = ⌈Daily_Vol / Net_Hours⌉
              </code>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-amber-400 font-bold block mb-1 font-sans">4. Capacity Fulfillment (%)</span>
              <p className="text-slate-300 text-[11px] mb-1">
                ความครอบคลุมยอดผลิตปัจจุบัน
              </p>
              <code className="text-yellow-300 block text-[11px] bg-black/40 p-1.5 rounded">
                Actual_Cap = Line_UPH × Net_Hours<br/>
                Fulfillment = (Actual_Cap / Daily_Vol) × 100%
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Add New Model Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleCreateSubmit} className="bg-blue-50/70 p-5 rounded-xl border border-blue-200 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>เพิ่มแผนการผลิต Model ใหม่ (Add Production Plan)</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
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
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สายการผลิตเป้าหมาย (Assigned Line)*
              </label>
              <select
                value={newModelLine}
                onChange={(e) => setNewModelLine(e.target.value as 'line-a' | 'line-b')}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-slate-800"
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
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold text-blue-700"
                />
                <span className="text-xs text-slate-500">pcs</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เดือนของแผนผลิต (Plan Month)
              </label>
              <input
                type="text"
                value={newModelMonth}
                onChange={(e) => setNewModelMonth(e.target.value)}
                placeholder="เช่น ตุลาคม 2026"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตลาด / ลูกค้าเป้าหมาย (Market/Customer)
              </label>
              <input
                type="text"
                value={newModelMarket}
                onChange={(e) => setNewModelMarket(e.target.value)}
                placeholder="เช่น ตลาดส่งออก ยุโรป/ญี่ปุ่น"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                สถานะแผนผลิต (Plan Status)
              </label>
              <select
                value={newModelStatus}
                onChange={(e) => setNewModelStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Active">Active (ผลิตตามปกติ)</option>
                <option value="Planned">Planned (อยู่ในแผนล่วงหน้า)</option>
                <option value="Ramp-up">Ramp-up (กำลังเร่งการผลิต)</option>
                <option value="Phase-out">Phase-out (เตรียมยุติการผลิต)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Lot Size (ขนาด Lot ต่อชุด)
              </label>
              <input
                type="number"
                step="50"
                min="50"
                value={newModelLotSize}
                onChange={(e) => setNewModelLotSize(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                คำอธิบาย / สเปกสินค้า & บันทึกเพิ่มเติม (Description & Notes)
              </label>
              <input
                type="text"
                placeholder="เช่น ตู้เย็น 2 ประตู 500 ลิตร สเปกคอมเพรสเซอร์ Inverter รหัสทดสอบพิเศษ"
                value={newModelDesc}
                onChange={(e) => setNewModelDesc(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>บันทึกและคำนวณอัตโนมัติ</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Preset Volume Scenario Selector */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>ชุดแผนการผลิตสำเร็จรูป (Volume Scenarios Presets):</span>
          </span>
          {onResetModelVolumes && (
            <button
              onClick={() => {
                onResetModelVolumes();
                triggerSaveNotice('✓ รีเซ็ตแผนการผลิตกลับสู่ค่าเริ่มต้นโรงงานและบันทึกอัตโนมัติแล้ว');
              }}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline"
            >
              รีเซ็ตกลับสู่ค่าเริ่มต้นโรงงาน
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => handleApplyPreset(2600, 2500, 'baseline', 'มาตรฐานปัจจุบัน (Baseline)')}
            className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
              activePreset === 'baseline'
                ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white/70 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">มาตรฐานปัจจุบัน (Baseline)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">5,100 pcs</span>
            </div>
            <p className="text-[11px] text-slate-500">A = 2,600 / B = 2,500 เครื่อง/วัน</p>
          </button>

          <button
            onClick={() => handleApplyPreset(3000, 2800, 'high-season', 'High Season (Peak)')}
            className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
              activePreset === 'high-season'
                ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white/70 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">High Season (Peak)</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">+13.7% Peak</span>
            </div>
            <p className="text-[11px] text-slate-500">A = 3,000 / B = 2,800 เครื่อง/วัน (รวม 5,800)</p>
          </button>

          <button
            onClick={() => handleApplyPreset(2400, 2400, 'balanced', 'Balanced 50:50')}
            className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
              activePreset === 'balanced'
                ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white/70 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Balanced 50:50</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">4,800 pcs</span>
            </div>
            <p className="text-[11px] text-slate-500">A = 2,400 / B = 2,400 เครื่อง/วัน</p>
          </button>

          <button
            onClick={() => handleApplyPreset(2000, 2000, 'maintenance', 'Maintenance Window')}
            className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
              activePreset === 'maintenance'
                ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-white/70 hover:bg-white border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-900">Maintenance Window</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">4,000 pcs</span>
            </div>
            <p className="text-[11px] text-slate-500">A = 2,000 / B = 2,000 เครื่อง/วัน</p>
          </button>
        </div>
      </div>

      {/* Models Table: Editable, Expandable & Deletable */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>ตารางแผนการผลิตแต่ละ Model (Master Production Plan):</span>
          </h4>
          <span className="text-xs text-slate-500">
            รวม {modelVolumes.length} โมเดล · พิมพ์แก้ไขตัวเลขยอดผลิตหรือกดปุ่มแก้ไขเพื่อปรับแผนงาน ทุกการเปลี่ยนแปลงจะบันทึกอัตโนมัติ
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700 uppercase">
                <th className="py-2.5 px-3">Model Name & Code</th>
                <th className="py-2.5 px-3">Assigned Line</th>
                <th className="py-2.5 px-3">Plan Month & Market</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Daily Volume (ยอด/วัน)</th>
                <th className="py-2.5 px-3 text-right">Shift Target (กะ)</th>
                <th className="py-2.5 px-3 text-right">Monthly (26d)</th>
                <th className="py-2.5 px-3 text-right">Annual (12m)</th>
                <th className="py-2.5 px-3 text-right">Mix Share</th>
                <th className="py-2.5 px-3 text-center">จัดการ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modelVolumes.map((item) => {
                const isEditing = editingId === item.id;
                const itemDaily = Number(item.dailyVolume) || 0;
                const itemShift = Math.round(itemDaily / 2);
                const itemMonthly = itemDaily * 26;
                const itemAnnual = itemMonthly * 12;
                const itemShare = totalDailyVolume > 0 ? (itemDaily / totalDailyVolume) * 100 : 0;
                const isLineA = item.line === 'line-a';

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/70 border-2 border-blue-400">
                      <td className="py-3 px-3 space-y-1">
                        <input
                          type="text"
                          value={editBuffer.name ?? item.name}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-xs font-bold outline-none"
                          placeholder="Model Name"
                        />
                        <input
                          type="text"
                          value={editBuffer.modelCode ?? item.modelCode}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, modelCode: e.target.value }))}
                          className="w-28 px-2 py-1 bg-white border border-blue-400 rounded text-xs font-mono font-bold outline-none"
                          placeholder="Code"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={editBuffer.line ?? item.line}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, line: e.target.value as any }))}
                          className="px-2 py-1 bg-white border border-blue-400 rounded text-xs font-semibold outline-none"
                        >
                          <option value="line-a">Line A</option>
                          <option value="line-b">Line B</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 space-y-1">
                        <input
                          type="text"
                          value={editBuffer.planMonth ?? item.planMonth ?? 'ตุลาคม 2026'}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, planMonth: e.target.value }))}
                          className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-[11px] outline-none"
                          placeholder="เดือนแผนผลิต"
                        />
                        <input
                          type="text"
                          value={editBuffer.customerOrMarket ?? item.customerOrMarket ?? ''}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, customerOrMarket: e.target.value }))}
                          className="w-full px-2 py-1 bg-white border border-blue-400 rounded text-[11px] outline-none"
                          placeholder="ตลาด/ลูกค้า"
                        />
                      </td>

                      <td className="py-3 px-3">
                        <select
                          value={editBuffer.status ?? item.status ?? 'Active'}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, status: e.target.value as any }))}
                          className="px-2 py-1 bg-white border border-blue-400 rounded text-[11px] outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Planned">Planned</option>
                          <option value="Ramp-up">Ramp-up</option>
                          <option value="Phase-out">Phase-out</option>
                        </select>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          step="10"
                          min="1"
                          value={editBuffer.dailyVolume ?? item.dailyVolume}
                          onChange={(e) => setEditBuffer((prev) => ({ ...prev, dailyVolume: Number(e.target.value) || 0 }))}
                          className="w-24 px-2 py-1 bg-white border border-blue-400 rounded text-xs text-right font-mono font-bold text-blue-700 outline-none"
                        />
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400 font-mono">-</td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">-</td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">-</td>
                      <td className="py-3 px-3 text-right text-slate-400 font-mono">-</td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-xs"
                            title="บันทึกและผูกสูตรอัตโนมัติ"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded"
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
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isLineA ? 'bg-blue-600' : 'bg-emerald-600'}`}></span>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{item.name}</span>
                            <span className="font-mono text-slate-500 text-[11px]">({item.modelCode})</span>
                            {item.isMain && (
                              <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200">
                                Main
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isLineA ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isLineA ? 'Line A' : 'Line B'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="text-[11px] text-slate-800 font-medium">
                        {item.planMonth || 'ตุลาคม 2026'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.customerOrMarket || 'ตลาดในประเทศ'}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Planned'
                          ? 'bg-purple-100 text-purple-800'
                          : item.status === 'Ramp-up'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'Phase-out'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.status || 'Active'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          step="50"
                          min="0"
                          value={itemDaily}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            onUpdateModelVolume(item.id, { dailyVolume: val });
                            triggerSaveNotice(`✓ อัปเดต Volume ${item.name} เป็น ${val.toLocaleString()} pcs และบันทึกอัตโนมัติแล้ว`);
                          }}
                          className={`w-20 px-1.5 py-0.5 text-right font-mono font-bold border rounded outline-none ${
                            isLineA 
                              ? 'bg-blue-50/50 border-blue-200 text-blue-800 focus:border-blue-500' 
                              : 'bg-emerald-50/50 border-emerald-200 text-emerald-800 focus:border-emerald-500'
                          }`}
                          title="แก้ไข Volume ได้โดยตรง และระบบจะบันทึกอัตโนมัติ"
                        />
                        <span className="text-[11px] text-slate-400">pcs</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {itemShift.toLocaleString()} pcs
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {itemMonthly.toLocaleString()} pcs
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {itemAnnual.toLocaleString()} pcs
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                      {itemShare.toFixed(1)}%
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="แก้ไขแผนการผลิตโมเดลนี้"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWithNotice(item.id, item.name)}
                          className="p-1 text-rose-500 hover:bg-rose-100 rounded"
                          title="ลบแผนการผลิตโมเดลนี้"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Volume Cards: Line A vs Line B vs Total Plant */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line A Card */}
        <div className="bg-gradient-to-b from-blue-50/70 to-white rounded-xl border-2 border-blue-200 p-5 space-y-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600"></div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center font-mono shadow-xs">
                A
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {lineAConfig.lineName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  รวม {modelsA.length} โมเดล · หลัก: {lineAConfig.model}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectLine('line-a')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-100/80 px-2 py-1 rounded-md"
            >
              ดู Line A →
            </button>
          </div>

          {/* Aggregated Volume for Line A */}
          <div className="bg-white p-3.5 rounded-xl border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Total Daily Target (ยอดผลิตรวม Line A):
              </label>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-base font-black text-blue-700">{volumeA.toLocaleString()}</span>
                <span className="text-xs text-slate-500">เครื่อง/วัน</span>
              </div>
            </div>

            {/* Models Pill summary */}
            <div className="flex flex-wrap gap-1 pt-1">
              {modelsA.map((m) => (
                <span key={m.id} className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-mono">
                  {m.modelCode}: {Number(m.dailyVolume).toLocaleString()} ({m.status || 'Active'})
                </span>
              ))}
            </div>
          </div>

          {/* Monthly & Annual Volume Details */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Monthly Volume (26 วัน)</span>
              <strong className="text-sm text-slate-900">{monthlyVolumeA.toLocaleString()}</strong> pcs
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Annual Volume (12 เดือน)</span>
              <strong className="text-sm text-slate-900">{annualVolumeA.toLocaleString()}</strong> pcs
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Shift Target (2 กะ)</span>
              <strong className="text-sm text-blue-700">{(volumeA / 2).toLocaleString()}</strong> pcs/shift
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Volume Share (สัดส่วน)</span>
              <strong className="text-sm text-blue-700">{shareA.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Line Speed & Capacity Alignment */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>กำลังผลิตปัจจุบัน (เดิน {lineAConfig.targetUph} UPH):</span>
              <span className="font-mono font-bold text-slate-900">{actualDailyCapA.toLocaleString()} เครื่อง/วัน</span>
            </div>

            <div className="flex justify-between items-center text-slate-700">
              <span>UPH ที่ต้องการเพื่อครบเป้า ({volumeA}):</span>
              <span className="font-mono font-bold text-blue-700">{reqUphA} UPH</span>
            </div>

            {/* Capacity Fulfillment Gauge */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">ความครอบคลุมยอดผลิต (Fulfillment):</span>
                <span className={`font-mono font-bold ${fulfillmentA >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {fulfillmentA}% {fulfillmentA >= 100 ? '✓ ผลิตได้ตามเป้า' : `(ขาด ${Math.abs(gapDailyA)} เครื่อง)`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    fulfillmentA >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, fulfillmentA)}%` }}
                ></div>
              </div>
            </div>

            {fulfillmentA < 100 && (
              <button
                onClick={handleSyncUphA}
                className="w-full mt-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>ปรับ UPH เป็น {reqUphA} เพื่อผลิตให้ได้ {volumeA} เครื่องพอดี</span>
              </button>
            )}
          </div>
        </div>

        {/* Line B Card */}
        <div className="bg-gradient-to-b from-emerald-50/70 to-white rounded-xl border-2 border-emerald-200 p-5 space-y-4 relative overflow-hidden shadow-xs">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600"></div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center font-mono shadow-xs">
                B
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  {lineBConfig.lineName}
                </h4>
                <p className="text-[11px] text-slate-500">
                  รวม {modelsB.length} โมเดล · หลัก: {lineBConfig.model}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectLine('line-b')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-100/80 px-2 py-1 rounded-md"
            >
              ดู Line B →
            </button>
          </div>

          {/* Aggregated Volume for Line B */}
          <div className="bg-white p-3.5 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Total Daily Target (ยอดผลิตรวม Line B):
              </label>
              <div className="flex items-center gap-1 font-mono">
                <span className="text-base font-black text-emerald-700">{volumeB.toLocaleString()}</span>
                <span className="text-xs text-slate-500">เครื่อง/วัน</span>
              </div>
            </div>

            {/* Models Pill summary */}
            <div className="flex flex-wrap gap-1 pt-1">
              {modelsB.map((m) => (
                <span key={m.id} className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                  {m.modelCode}: {Number(m.dailyVolume).toLocaleString()} ({m.status || 'Active'})
                </span>
              ))}
            </div>
          </div>

          {/* Monthly & Annual Volume Details */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Monthly Volume (26 วัน)</span>
              <strong className="text-sm text-slate-900">{monthlyVolumeB.toLocaleString()}</strong> pcs
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Annual Volume (12 เดือน)</span>
              <strong className="text-sm text-slate-900">{annualVolumeB.toLocaleString()}</strong> pcs
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Shift Target (2 กะ)</span>
              <strong className="text-sm text-emerald-700">{(volumeB / 2).toLocaleString()}</strong> pcs/shift
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 font-sans block">Volume Share (สัดส่วน)</span>
              <strong className="text-sm text-emerald-700">{shareB.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Line Speed & Capacity Alignment */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700">
              <span>กำลังผลิตปัจจุบัน (เดิน {lineBConfig.targetUph} UPH):</span>
              <span className="font-mono font-bold text-slate-900">{actualDailyCapB.toLocaleString()} เครื่อง/วัน</span>
            </div>

            <div className="flex justify-between items-center text-slate-700">
              <span>UPH ที่ต้องการเพื่อครบเป้า ({volumeB}):</span>
              <span className="font-mono font-bold text-emerald-700">{reqUphB} UPH</span>
            </div>

            {/* Capacity Fulfillment Gauge */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-500">ความครอบคลุมยอดผลิต (Fulfillment):</span>
                <span className={`font-mono font-bold ${fulfillmentB >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {fulfillmentB}% {fulfillmentB >= 100 ? '✓ ผลิตได้ตามเป้า' : `(ขาด ${Math.abs(gapDailyB)} เครื่อง)`}
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    fulfillmentB >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, fulfillmentB)}%` }}
                ></div>
              </div>
            </div>

            {fulfillmentB < 100 && (
              <button
                onClick={handleSyncUphB}
                className="w-full mt-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>ปรับ UPH เป็น {reqUphB} เพื่อผลิตให้ได้ {volumeB} เครื่องพอดี</span>
              </button>
            )}
          </div>
        </div>

        {/* Combined Plant Total Volume Card */}
        <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Total Plant Production Volume (รวมทั้งโรงงาน)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Line A ({volumeA.toLocaleString()}) + Line B ({volumeB.toLocaleString()})
                </p>
              </div>
            </div>

            {/* Total Daily Output Metric */}
            <div className="mt-4 p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 text-center">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                Total Factory Daily Volume Target (ยอดรวมต่อวัน)
              </span>
              <div className="flex items-baseline justify-center gap-2 mt-1">
                <span className="text-3xl font-black text-white font-mono">
                  {totalDailyVolume.toLocaleString()}
                </span>
                <span className="text-xs text-slate-400">เครื่อง/วัน</span>
              </div>
            </div>

            {/* Volume Mix Ratio Bar */}
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-400">Line A: {shareA.toFixed(1)}%</span>
                <span className="text-emerald-400">Line B: {shareB.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${shareA}%` }}
                  title={`Line A: ${shareA.toFixed(1)}%`}
                ></div>
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${shareB}%` }}
                  title={`Line B: ${shareB.toFixed(1)}%`}
                ></div>
              </div>
            </div>

            {/* Plant Capacity Figures */}
            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Monthly Volume (26 วัน):</span>
                <strong className="text-white">{totalMonthlyVolume.toLocaleString()} เครื่อง/เดือน</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Annual Volume (12 เดือน):</span>
                <strong className="text-white">{totalAnnualVolume.toLocaleString()} เครื่อง/ปี</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800 text-slate-300">
                <span className="text-slate-400">Total Plant Headcount:</span>
                <strong className="text-yellow-400">{lineAMetrics.grandTotalHeadcount + lineBMetrics.grandTotalHeadcount} คน (MP)</strong>
              </div>
              <div className="flex justify-between py-1 text-slate-300">
                <span className="text-slate-400">Combined DL UPPH:</span>
                <strong className="text-emerald-400">
                  {((lineAMetrics.overallDLUPPH + lineBMetrics.overallDLUPPH) / 2).toFixed(3)} units/man-h
                </strong>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-blue-950/60 rounded-lg border border-blue-900/60 text-[11px] text-blue-200">
            ✓ ระบบบันทึกอัตโนมัติ (Auto-save) ข้อมูลแผนการผลิตลงในหน่วยความจำของเว็บ เมื่อรีเฟรชหน้าจะยังคงอยู่ครบถ้วน
          </div>
        </div>
      </div>
    </div>
  );
};
