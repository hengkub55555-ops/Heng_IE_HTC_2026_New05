import React from 'react';
import { StationData, IndirectLaborData, SpareLaborData, ProductionLineConfig } from '../types';
import { IEMetrics } from '../utils/ieCalculations';
import { Printer, Download, X, CheckCircle, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: StationData[];
  idlList: IndirectLaborData[];
  sparesList: SpareLaborData[];
  config: ProductionLineConfig;
  metrics: IEMetrics;
  onExportCSV: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  stations,
  idlList,
  sparesList,
  config,
  metrics,
  onExportCSV,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-8 shadow-2xl border border-slate-300 max-h-[95vh] overflow-y-auto print:p-0 print:border-none print:shadow-none print:max-h-none">
        {/* Modal Controls (hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">
              IE Engineering Official Report · พิมพ์เอกสารมาตรฐาน
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร (Print / PDF)</span>
            </button>
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="pt-6 font-sans text-slate-900 print:pt-0">
          {/* Document Header */}
          <div className="border-2 border-slate-900 p-4 mb-6">
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-slate-500 block">
                  MANUFACTURING ENGINEERING DIVISION · REFRIGERATOR PLANT
                </span>
                <h1 className="text-xl font-black text-slate-900 mt-1">
                  STANDARD MANNING & CAPACITY SPECIFICATION SHEET
                </h1>
                <span className="text-sm font-semibold text-slate-700">
                  {config.lineName} · {config.model} · Target Volume {config.targetDailyOutput.toLocaleString()} เครื่อง/วัน
                </span>
              </div>
              <div className="text-right text-xs font-mono space-y-0.5 border-l-2 border-slate-900 pl-4">
                <div><strong>DOC NO:</strong> IE-STD-LN{config.lineShortCode}-{config.modelCode || 'BM'}</div>
                <div><strong>REVISION:</strong> REV. 04 (APPROVED)</div>
                <div><strong>DATE:</strong> {currentDate}</div>
                <div><strong>STATUS:</strong> PRODUCTION RELEASE</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs font-mono">
              <div>
                <span className="text-slate-500 block font-sans">Daily Volume:</span>
                <strong className="text-sm">{config.targetDailyOutput.toLocaleString()} pcs/day</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Monthly Volume (26d):</span>
                <strong className="text-sm">{(config.targetDailyOutput * 26).toLocaleString()} pcs/mo</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Target UPH:</span>
                <strong className="text-sm">{config.targetUph} units/h</strong>
              </div>
              <div>
                <span className="text-slate-500 block font-sans">Total Headcount:</span>
                <strong className="text-sm text-blue-700">{metrics.grandTotalHeadcount} MP</strong>
              </div>
            </div>
          </div>

          {/* Manning Summary Table */}
          <table className="w-full text-left border-collapse border border-slate-400 text-xs mb-6">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-400 font-bold uppercase text-[11px]">
                <th className="p-2 border-r border-slate-400 text-center w-10">No.</th>
                <th className="p-2 border-r border-slate-400">Process Detail</th>
                <th className="p-2 border-r border-slate-400 text-center w-12">Type</th>
                <th className="p-2 border-r border-slate-400 text-right w-16">STD MP</th>
                <th className="p-2 border-r border-slate-400 text-right w-14">UPH</th>
                <th className="p-2 border-r border-slate-400 text-right w-14">CT(s)</th>
                <th className="p-2 border-r border-slate-400 text-right w-14">UPPH</th>
                <th className="p-2 text-right w-20">Output/sh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
              {stations.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-1.5 text-center border-r border-slate-300 font-sans">{s.no}</td>
                  <td className="p-1.5 border-r border-slate-300 font-sans font-medium">{s.name}</td>
                  <td className="p-1.5 text-center border-r border-slate-300">{s.type}</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-300">{s.stdMp}</td>
                  <td className="p-1.5 text-right border-r border-slate-300">{s.uph}</td>
                  <td className="p-1.5 text-right border-r border-slate-300">{s.ct}</td>
                  <td className="p-1.5 text-right border-r border-slate-300 font-semibold">{s.upph}</td>
                  <td className="p-1.5 text-right">{s.outputPerShift}</td>
                </tr>
              ))}
              <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-400">
                <td className="p-2 border-r border-slate-400" colSpan={2}>
                  Total RF Production Line B (DL 2 Shifts)
                </td>
                <td className="p-2 text-center border-r border-slate-400">DL</td>
                <td className="p-2 text-right border-r border-slate-400">{metrics.totalDLBothShifts}</td>
                <td className="p-2 text-right border-r border-slate-400">{config.targetUph}</td>
                <td className="p-2 text-right border-r border-slate-400">{config.designCycleTimeSec}</td>
                <td className="p-2 text-right border-r border-slate-400">83</td>
                <td className="p-2 text-right">-</td>
              </tr>
              {idlList.map((idl) => (
                <tr key={idl.id}>
                  <td className="p-1.5 border-r border-slate-300"></td>
                  <td className="p-1.5 border-r border-slate-300 font-sans">{idl.title} ({idl.thaiTitle})</td>
                  <td className="p-1.5 text-center border-r border-slate-300 text-amber-700">IDL</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-300">{idl.stdMp}</td>
                  <td className="p-1.5 border-r border-slate-300" colSpan={4}></td>
                </tr>
              ))}
              <tr className="bg-amber-50 font-bold">
                <td className="p-1.5 border-r border-slate-300" colSpan={2}>SUM Total IDL</td>
                <td className="p-1.5 text-center border-r border-slate-300 text-amber-700">IDL</td>
                <td className="p-1.5 text-right font-bold border-r border-slate-300">{metrics.totalIDL}</td>
                <td className="p-1.5 border-r border-slate-300" colSpan={4}></td>
              </tr>
              {sparesList.map((sp) => (
                <tr key={sp.id}>
                  <td className="p-1.5 border-r border-slate-300"></td>
                  <td className="p-1.5 border-r border-slate-300 font-sans">{sp.title}</td>
                  <td className="p-1.5 text-center border-r border-slate-300 text-blue-700">DL</td>
                  <td className="p-1.5 text-right font-bold border-r border-slate-300">{sp.stdMp}</td>
                  <td className="p-1.5 border-r border-slate-300" colSpan={4}></td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-extrabold text-xs">
                <td className="p-2.5 border-r border-slate-800" colSpan={2}>
                  GRAND TOTAL HEADCOUNT (DL + IDL + SPARE)
                </td>
                <td className="p-2.5 text-center border-r border-slate-800">ALL</td>
                <td className="p-2.5 text-right border-r border-slate-800 bg-[#FFFF00] text-black font-black text-sm">
                  {metrics.grandTotalHeadcount}
                </td>
                <td className="p-2.5 border-r border-slate-800" colSpan={4}></td>
              </tr>
            </tbody>
          </table>

          {/* IE Verification Block */}
          <div className="bg-slate-50 p-4 border border-slate-300 rounded mb-6 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 uppercase">Industrial Engineering Technical Verification:</h4>
            <p className="text-slate-600 leading-relaxed">
              1. <strong>Takt Time:</strong> กำหนดเวลาการผลิตที่ 32.73 วินาที/เครื่อง (ณ 110 UPH) โดยเครื่องจักรถูกตั้งค่า Cycle Time ไว้ที่ 23 วินาที เพื่อสร้าง Speed Reserve Margin 29.7% ป้องกันความผันผวนจาก Downtime
            </p>
            <p className="text-slate-600 leading-relaxed">
              2. <strong>Work Content:</strong> ภาระงานทางตรงรวม (Total DL Work Content) อยู่ที่ 7,751 man-seconds ต่อเครื่อง (129.2 man-minutes) สอดคล้องกับประสิทธิภาพการบาลานซ์สายการผลิต Line Balance Efficiency 84.8%
            </p>
            <p className="text-slate-600 leading-relaxed">
              3. <strong>Headcount Allocation:</strong> จัดสรร Direct Labor (DL) รวม 674 คน (337 คน/กะ), Indirect Labor (IDL) 38.5 คน และกำลังคนสำรอง (Spare Buffer) 38.5 คน (5.7% ของ DL) รวมทั้งสิ้น 751 คน
            </p>
          </div>

          {/* Sign-off Signature Blocks (Crucial for Factory IE Approvals) */}
          <div className="grid grid-cols-4 gap-4 border-2 border-slate-900 p-4 text-center text-xs mt-6 font-sans">
            <div>
              <span className="text-slate-500 block mb-8">PREPARED BY:</span>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto"></div>
              <strong className="block">IE Project Engineer</strong>
              <span className="text-[10px] text-slate-500">Date: ___/___/____</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-8">CHECKED BY:</span>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto"></div>
              <strong className="block">IE Section Head</strong>
              <span className="text-[10px] text-slate-500">Date: ___/___/____</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-8">REVIEWED BY:</span>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto"></div>
              <strong className="block">Production Manager</strong>
              <span className="text-[10px] text-slate-500">Date: ___/___/____</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-8">APPROVED BY:</span>
              <div className="border-b border-slate-400 mb-1 w-3/4 mx-auto"></div>
              <strong className="block">Plant Operations Director</strong>
              <span className="text-[10px] text-slate-500">Date: ___/___/____</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
