export type Lang = "en" | "sw" | "rw";
export type Role = "Attendant" | "Supervisor" | "Station Manager";
export type Currency = "KES" | "TZS" | "UGX" | "RWF";
export type Country = "Kenya" | "Tanzania" | "Uganda" | "Rwanda";
export type TenantTheme = "neutral" | "petropal";
export type ShiftStatus = "OPEN" | "LOCKED" | "CLOSED";
export type InvestigationCause =
  | "PUMP_CALIBRATION"
  | "DRIVE_OFF"
  | "SHORT_DROP"
  | "TANK_LEAK"
  | "CASH_SHORTFALL"
  | "OTHER";

export interface ChartPoint {
  cm: number;
  litres: number;
}

export type Calibration =
  | { mode: "geometry"; diameterCm: number; lengthCm: number }
  | { mode: "table"; points: ChartPoint[] };

export interface Tank {
  id: string;
  name: string;
  product: string;
  capacityL: number;
  calibration: Calibration;
}

export interface DipReading {
  id: string;
  ts: string;
  tankId: string;
  cm: number;
  litres: number;
  waterCm: number | null;
  waterLitres: number | null;
  kind: "DIP" | "PRE_DROP" | "POST_DROP" | "CLOSING";
  role: Role;
}

export interface Delivery {
  tankId: string;
  preDropL: number;
  postDropL: number;
  omnicommL: number | null;
  waybillNo: string;
  gpsArrivalIso: string | null;
}

export interface NozzleMeter {
  id: string;
  name: string;
  tankId: string;
  open: number;
  close: number;
}

export interface Shift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  status: ShiftStatus;
  openingL: Record<string, number>;
  deliveries: Delivery[];
  meters: NozzleMeter[];
  closingL: Record<string, number>;
  atgL: Record<string, number>;
  prices: Record<string, number>;
  cash: { cash: number; mobileMoney: number; card: number };
  investigation: { cause: InvestigationCause; note: string; role: Role; ts: string } | null;
  signOff: { name: string; role: Role; ts: string } | null;
}

export interface LedgerEntry {
  seq: number;
  ts: string;
  role: Role;
  type: string;
  summary: string;
  payload: unknown;
  prevHash: string;
  hash: string;
}

export interface Ticket {
  id: string;
  ts: string;
  source: "WETSTOCK" | "DIP" | "CONNECTOR";
  severity: "HIGH" | "CRITICAL";
  asset: string;
  detail: string;
  status: "LOCAL_ONLY" | "FORWARDED" | "FAILED";
}

export interface Settings {
  stationName: string;
  country: Country;
  currency: Currency;
  role: Role;
  lang: Lang;
  tenant: TenantTheme;
  volumetricTolPct: number;
  deliveryTolPct: number;
  thresholds: Record<Currency, number>;
}

export interface AppState {
  version: 1;
  settings: Settings;
  tanks: Tank[];
  nozzles: NozzleMeter[];
  dips: DipReading[];
  shifts: Shift[];
  ledger: LedgerEntry[];
  tickets: Ticket[];
  completedDrills: Record<string, boolean>;
  trainingSignoffs: string[];
}
