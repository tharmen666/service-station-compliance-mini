export type Lang = "en-KE" | "sw" | "en-GH" | "en-ZA" | "zu" | "af" | "rw";
export type Role = "Attendant" | "Supervisor" | "Station Manager";
export type Currency = "KES" | "TZS" | "GHS" | "ZAR" | "UGX" | "RWF";
export type Country = "Kenya" | "Tanzania" | "Ghana" | "South Africa" | "Uganda" | "Rwanda";
export type TenantTheme = "neutral" | "petropal";
export type ShiftStatus = "OPEN" | "LOCKED" | "CLOSED";
export type DipstickType = "wooden" | "aluminium";
export type GaugingMode = "MANUAL" | "HYBRID" | "ATG";
export type OhsChecklistStatus = "OK" | "NOT_OK" | "NA";

export type InvestigationCause =
  | "CALIBRATION_DRIFT"
  | "SUSPECTED_UNDERGROUND_LEAK"
  | "DELIVERY_SHORT_DROP"
  | "METER_ERROR"
  | "THEFT_UNACCOUNTED"
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
  dipstickType: DipstickType;
  role: Role;
}

export interface Delivery {
  tankId: string;
  preDropL: number;
  postDropL: number;
  omnicommL: number | null;
  deliveryNoteL?: number | null;
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
  gaugingMode?: GaugingMode;
  openingL: Record<string, number>;
  deliveries: Delivery[];
  meters: NozzleMeter[];
  closingL: Record<string, number>;
  atgL: Record<string, number>;
  waterMm?: Record<string, number>;
  posSalesL?: Record<string, number>;
  atgTelemetryMeta?: {
    source: string;
    capturedAt: string;
    probeSchema: string;
  } | null;
  prices: Record<string, number>;
  cash: { cash: number; mobileMoney: number; card: number };
  investigation: { cause: InvestigationCause; note: string; role: Role; ts: string } | null;
  signOff: { name: string; supervisorId?: string; role: Role; ts: string; hash?: string } | null;
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

export interface SiteProfile {
  id: string;
  siteName: string;
  brandNetwork: string;
  siteCode: string;
  physicalAddress: string;
  country: Country;
  currency: Currency;
  section162Manager: string;
  emergencyContact: string;
  tankCount: number;
  dispenserCount: number;
}

export interface SiteOperationalData {
  tanks: Tank[];
  nozzles: NozzleMeter[];
  dips: DipReading[];
  shifts: Shift[];
  tickets: Ticket[];
  completedDrills: Record<string, boolean>;
  trainingSignoffs: string[];
  ohsChecklistMarks: Record<string, Record<string, OhsChecklistStatus>>;
}

export interface Settings {
  stationName: string;
  brandNetwork: string;
  siteCode: string;
  physicalAddress: string;
  section162Manager: string;
  emergencyContact: string;
  tankCount: number;
  dispenserCount: number;
  country: Country;
  currency: Currency;
  role: Role;
  lang: Lang;
  tenant: TenantTheme;
  volumetricTolPct: number;
  deliveryTolPct: number;
  waterThresholdMm?: number;
  voiceRate?: number;
  thresholds: Record<Currency, number>;
}

export interface AppState {
  version: 1;
  activeSiteId: string;
  sites: SiteProfile[];
  siteDataById: Record<string, SiteOperationalData>;
  settings: Settings;
  tanks: Tank[];
  nozzles: NozzleMeter[];
  dips: DipReading[];
  shifts: Shift[];
  ledger: LedgerEntry[];
  tickets: Ticket[];
  completedDrills: Record<string, boolean>;
  trainingSignoffs: string[];
  ohsChecklistMarks: Record<string, Record<string, OhsChecklistStatus>>;
}
