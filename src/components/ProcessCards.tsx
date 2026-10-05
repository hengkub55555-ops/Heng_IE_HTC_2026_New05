import React, { useState } from 'react';
import { StationData } from '../types';
import { 
  Wrench, 
  ShieldCheck, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  Users, 
  Clock, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ProcessCardsProps {
  stations: StationData[];
}

export const ProcessCards: React.FC<ProcessCardsProps> = ({ stations }) => {
  const [expandedStation, setExpandedStation] = useState<number | null>(null);

  // Group stations by No (1 to 8) from Shift A
  const shiftAStations = stations.filter((s) => s.shift === 'Shift-A');

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Process Workstation Breakdown & SOP (ผังรายละเอียด 8 กระบวนการผลิตตู้เย็น BM400)
            </h2>
            <p className="text-xs text-slate-500">
              รายละเอียดวิศวกรรมการผลิต เครื่องจักรที่ใช้ จุดควบคุมคุณภาพ (QC) และการจัดสรรกำลังคนในไลน์ย่อย (Sub-lines)
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 8 Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {shiftAStations.map((station) => {
          const isExpanded = expandedStation === station.no;
          const isBottleneck = station.stdMp >= 60;

          return (
            <div
              key={station.no}
              className={`bg-white rounded-xl border transition-all duration-200 shadow-sm overflow-hidden ${
                isExpanded ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center font-mono text-sm shadow-inner flex-shrink-0">
                      #{station.no}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm">
                          {station.name.replace(' (Shift-A)', '')}
                        </h3>
                        {station.linesCount === 2 && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                            2 Lines Parallel
                          </span>
                        )}
                        {isBottleneck && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                            High Manpower
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {station.thaiName.replace(' (กะ A)', '')}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setExpandedStation(isExpanded ? null : station.no)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {station.description}
                </p>

                {/* Key Metric Tags */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-center font-mono text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">STD MP</span>
                    <span className="font-bold text-slate-900">{station.stdMp}</span>
                    <span className="text-[9px] text-slate-400 block font-sans">({station.stdMp * 2} รวม 2 กะ)</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">UPH</span>
                    <span className="font-bold text-blue-700">{station.uph}</span>
                    <span className="text-[9px] text-slate-400 block font-sans">units/h</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">UPPH</span>
                    <span className="font-bold text-emerald-700">{station.upph}</span>
                    <span className="text-[9px] text-slate-400 block font-sans">pcs/man-h</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-sans uppercase">Output/Shift</span>
                    <span className="font-bold text-purple-700">{station.outputPerShift}</span>
                    <span className="text-[9px] text-slate-400 block font-sans">pcs/คน</span>
                  </div>
                </div>
              </div>

              {/* Subline Manpower Distribution */}
              {station.sublineMpDistribution && (
                <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 text-xs">
                  <span className="text-[11px] font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    การกระจายกำลังคนตามไลน์ย่อย (Sub-line Allocation):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {station.sublineMpDistribution.map((sub, i) => (
                      <div
                        key={i}
                        className="bg-white p-2 rounded border border-slate-200/80 flex items-center justify-between font-mono"
                      >
                        <span className="text-slate-700 font-sans text-xs">{sub.line}</span>
                        <span className="font-bold text-blue-700">{sub.mp} คน</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expandable Technical Details */}
              {isExpanded && (
                <div className="p-5 space-y-4 text-xs bg-white animate-fadeIn">
                  {/* Equipment List */}
                  {station.equipment && (
                    <div>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-600" />
                        เครื่องจักรและอุปกรณ์หลัก (Machinery & Tooling):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {station.equipment.map((eq, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded text-xs border border-slate-200"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Standard Work Steps */}
                  {station.workDetails && (
                    <div>
                      <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ขั้นตอนการทำงานตามมาตรฐาน (Standard Work Elements):
                      </span>
                      <ul className="space-y-1.5 text-slate-600">
                        {station.workDetails.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-blue-600 font-bold font-mono">0{idx + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Safety & Quality Control Notes */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 leading-relaxed">
                    <span className="font-bold flex items-center gap-1 text-amber-800 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                      จุดตรวจสอบคุณภาพ (QC) & ข้อควรระวังความปลอดภัย (Safety Note):
                    </span>
                    {station.no === 6 && (
                      <p>
                        ⚠️ สารทำความเย็น R600a เป็นก๊าซไวไฟ ต้องมีระบบระบายอากาศ Exhaust Hood และ Sniffer Leak Detector 100% ห้ามเกิดประกายไฟในรัศมี 5 เมตร
                      </p>
                    )}
                    {station.no === 4 && (
                      <p>
                        ⚠️ สารเคมี PU Foam มีสาร Isocyanate ไอระเหย ต้องสวมหน้ากากกรองสารเคมี แว่นตานิรภัย และตรวจเช็คอุณหภูมิ Jig แม่พิมพ์ที่ 45°C ± 3°C สม่ำเสมอ
                      </p>
                    )}
                    {station.no === 7 && (
                      <p>
                        ⚠️ ทดสอบ Hi-Pot ความปลอดภัยทางไฟฟ้า 100% ที่ 1,500V แรงดันไฟฟ้ารั่วไหลต่ำกว่า 0.75mA ตามมาตรฐาน มอก. และสากล
                      </p>
                    )}
                    {station.no !== 4 && station.no !== 6 && station.no !== 7 && (
                      <p>
                        ปฏิบัติตามมาตรฐาน 5S สวมใส่อุปกรณ์ PPE ครบถ้วน (ถุงมือกันบาด แว่นตา และรองเท้าหัวเหล็ก) ตรวจสอบ Poka-Yoke ทุกชั่วโมง
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
