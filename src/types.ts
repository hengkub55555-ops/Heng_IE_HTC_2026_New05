export type ShiftType = 'A' | 'B' | 'combined';
export type LaborType = 'DL' | 'IDL';
export type ActiveLine = 'line-b' | 'line-a' | 'plant-overview';

export interface StationData {
  id: string;
  no: number;
  name: string;
  thaiName: string;
  shift: 'Shift-A' | 'Shift-B';
  type: LaborType;
  stdMp: number;
  uph: number;
  ct: number; // Cycle time in seconds
  upph: number; // Units per person hour
  outputPerShift: number; // Theoretical output per operator per shift
  linesCount?: number;
  description?: string;
  workDetails?: string[];
  equipment?: string[];
  sublineMpDistribution?: { line: string; mp: number }[];
}

export interface IndirectLaborData {
  id: string;
  title: string;
  thaiTitle: string;
  type: 'IDL';
  stdMp: number;
  description: string;
}

export interface SpareLaborData {
  id: string;
  title: string;
  thaiTitle: string;
  type: 'DL';
  stdMp: number;
  shift: 'Shift-A' | 'Shift-B';
}

export interface ModelVolumeItem {
  id: string;
  name: string;
  modelCode: string;
  description: string;
  line: 'line-a' | 'line-b';
  dailyVolume: number;
  isMain?: boolean;
  // Extended Production Plan & IE Engineering Specs
  planMonth?: string; // e.g. "ตุลาคม 2026"
  customerOrMarket?: string; // e.g. "ตลาดในประเทศ (Domestic)" or "ส่งออก EU/Japan"
  status?: 'Active' | 'Planned' | 'Ramp-up' | 'Phase-out';
  colorTag?: string; // e.g. "#2563eb"
  targetLotSize?: number; // e.g. 500
  notes?: string;

  // Accurate IE Parameters per Model for Forecast
  modelCycleTimeSec?: number; // Cycle time specific to this model (sec)
  workContentSec?: number; // Total manual work content time across all operations (sec)
  oeePercent?: number; // Expected Overall Equipment Effectiveness (%)
  spareMpBufferPercent?: number; // Buffer MP percentage for absentees/relief (%)
  leadTimeHours?: number; // Production throughput lead time (hrs)
}

export interface ProductionLineConfig {
  id: 'line-a' | 'line-b';
  lineName: string;
  lineShortCode: 'A' | 'B';
  model: string;
  modelCode?: string;
  modelDescription?: string;
  targetDailyOutput: number; // Daily Volume (ยอดการผลิตต่อวัน)
  targetUph: number;
  designCycleTimeSec: number;
  workingShiftsPerDay: number;
  netShiftHours: number; // 10.5 hours standard net working time
  shiftHoursTotal: number; // 12 hours total shift with breaks
  hourlyWageTHB: number;
  monthlySalaryDLTHB: number;
  monthlySalaryIDLTHB: number;
}

export interface LineDataset {
  config: ProductionLineConfig;
  stations: StationData[];
  idlList: IndirectLaborData[];
  sparesList: SpareLaborData[];
}

export interface KaizenChange {
  stationNo: number;
  mpDeltaPerShift: number;
  note: string;
}

export interface SimulationState {
  targetDailyOutput: number;
  targetUph: number;
  netShiftHours: number;
  oeePercentage: number;
  kaizenChanges: Record<number, number>;
  spareMpPercent: number;
}
