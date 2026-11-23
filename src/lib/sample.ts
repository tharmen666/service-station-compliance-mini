import { appendLedger } from "./ledger";
import { sha256Hex } from "./sha256";
import type {
  AppState,
  NozzleMeter,
  Settings,
  Shift,
  SiteOperationalData,
  SiteProfile,
  Tank,
} from "./types";

export const SETTINGS: Settings = {
  stationName: "East Africa Pilot Forecourt 01",
  brandNetwork: "Independent Retail Forecourt",
  siteCode: "KE-PILOT-01",
  physicalAddress: "Industrial Corridor Highway, Plot 01",
  section162Manager: "Assigned Site Manager (16.2)",
  emergencyContact: "999 / 112 (Regional EMS & Fire)",
  tankCount: 3,
  dispenserCount: 4,
  country: "Kenya",
  currency: "KES",
  role: "Station Manager",
  lang: "en-KE",
  tenant: "neutral",
  volumetricTolPct: 0.5,
  deliveryTolPct: 0.5,
  waterThresholdMm: 15,
  voiceRate: 1.0,
  thresholds: { KES: 1500, TZS: 28000, GHS: 180, ZAR: 250, UGX: 40000, RWF: 15000 },
};

export const DEFAULT_SITE_PROFILE: SiteProfile = {
  id: "site-default-01",
  siteName: SETTINGS.stationName,
  brandNetwork: SETTINGS.brandNetwork,
  siteCode: SETTINGS.siteCode,
  physicalAddress: SETTINGS.physicalAddress,
  country: SETTINGS.country,
  currency: SETTINGS.currency,
  section162Manager: SETTINGS.section162Manager,
  emergencyContact: SETTINGS.emergencyContact,
  tankCount: SETTINGS.tankCount,
  dispenserCount: SETTINGS.dispenserCount,
};

export const TANKS: Tank[] = [
  {
    id: "T1",
    name: "Tank 1",
    product: "PMS (Unleaded Petrol)",
    capacityL: 30000,
    calibration: { mode: "geometry", diameterCm: 200, lengthCm: 955 },
  },
  {
    id: "T2",
    name: "Tank 2",
    product: "AGO (Automotive Gas Oil / Diesel)",
    capacityL: 30000,
    calibration: { mode: "geometry", diameterCm: 200, lengthCm: 955 },
  },
  {
    id: "T3",
    name: "Tank 3",
    product: "IK (Illuminating Kerosene)",
    capacityL: 15000,
    calibration: { mode: "geometry", diameterCm: 180, lengthCm: 589 },
  },
];

const DEFAULT_NOZZLES: NozzleMeter[] = [
  { id: "N1", name: "PMS-1", tankId: "T1", open: 124010, close: 126110 },
  { id: "N2", name: "PMS-2", tankId: "T1", open: 100950, close: 102350 },
  { id: "N3", name: "AGO-1", tankId: "T2", open: 68780, close: 70480 },
  { id: "N4", name: "IK-1", tankId: "T3", open: 40990, close: 41490 },
];

const NOW = new Date();
const iso = (d: Date) => d.toISOString();
const twoDaysAgo = new Date(NOW.getTime() - 48 * 3600 * 1000);
const yesterday = new Date(NOW.getTime() - 24 * 3600 * 1000);

// Two days ago: closed and signed. Balanced within tolerance.
const historicalShift1: Shift = {
  id: "S-0001",
  openedAt: iso(new Date(twoDaysAgo.getTime() - 8 * 3600 * 1000)),
  closedAt: iso(twoDaysAgo),
  status: "CLOSED",
  gaugingMode: "MANUAL",
  openingL: { T1: 27100, T2: 21500, T3: 10600 },
  deliveries: [],
  meters: [
    { id: "N1", name: "PMS-1", tankId: "T1", open: 117150, close: 120450 },
    { id: "N2", name: "PMS-2", tankId: "T1", open: 95810, close: 98210 },
    { id: "N3", name: "AGO-1", tankId: "T2", open: 63570, close: 66120 },
    { id: "N4", name: "IK-1", tankId: "T3", open: 39410, close: 40210 },
  ],
  closingL: { T1: 21400, T2: 18950, T3: 9800 },
  atgL: { T1: 21395, T2: 18948, T3: 9802 },
  waterMm: { T1: 0, T2: 2, T3: 0 },
  prices: { T1: 183, T2: 170, T3: 150 },
  cash: { cash: 910000, mobileMoney: 626700, card: 60000 },
  investigation: null,
  signOff: {
    name: "Shift Supervisor (SUP-014)",
    supervisorId: "SUP-014",
    role: "Supervisor",
    ts: iso(twoDaysAgo),
    hash: sha256Hex("S-0001|SUP-014|CLOSED"),
  },
};

// Yesterday's shift: closed and signed. Variance within tolerance.
const closedShift: Shift = {
  id: "S-0002",
  openedAt: iso(new Date(yesterday.getTime() - 8 * 3600 * 1000)),
  closedAt: iso(yesterday),
  status: "CLOSED",
  gaugingMode: "MANUAL",
  openingL: { T1: 21400, T2: 18950, T3: 9800 },
  deliveries: [
    {
      tankId: "T1",
      preDropL: 8600,
      postDropL: 18600,
      omnicommL: 10000,
      deliveryNoteL: 10000,
      waybillNo: "WB-44021",
      gpsArrivalIso: iso(yesterday),
    },
  ],
  meters: [
    { id: "N1", name: "PMS-1", tankId: "T1", open: 120450, close: 124010 },
    { id: "N2", name: "PMS-2", tankId: "T1", open: 98210, close: 100950 },
    { id: "N3", name: "AGO-1", tankId: "T2", open: 66120, close: 68780 },
    { id: "N4", name: "IK-1", tankId: "T3", open: 40210, close: 40990 },
  ],
  closingL: { T1: 26900, T2: 16190, T3: 8790 },
  atgL: { T1: 26880, T2: 16205, T3: 8785 },
  waterMm: { T1: 0, T2: 3, T3: 0 },
  prices: { T1: 183, T2: 170, T3: 150 },
  cash: { cash: 412000, mobileMoney: 318500, card: 27000 },
  investigation: null,
  signOff: {
    name: "Shift Supervisor (SUP-014)",
    supervisorId: "SUP-014",
    role: "Supervisor",
    ts: iso(yesterday),
    hash: sha256Hex("S-0002|SUP-014|CLOSED"),
  },
};

// Today's shift: open, with active meters and opening stock carried forward.
const openShift: Shift = {
  id: "S-0003",
  openedAt: iso(NOW),
  closedAt: null,
  status: "OPEN",
  gaugingMode: "MANUAL",
  openingL: { T1: 26900, T2: 16190, T3: 8790 },
  deliveries: [],
  meters: DEFAULT_NOZZLES,
  closingL: {},
  atgL: {},
  waterMm: { T1: 0, T2: 3, T3: 0 },
  prices: { T1: 183, T2: 170, T3: 150 },
  cash: { cash: 510000, mobileMoney: 440000, card: 54500 },
  investigation: null,
  signOff: null,
};

export function buildSampleState(): AppState {
  let ledger: AppState["ledger"] = [];
  ledger = appendLedger(
    ledger,
    "Station Manager",
    "SAMPLE_LOAD",
    `${SETTINGS.stationName} (${SETTINGS.siteCode}) sample loaded`,
    { tanks: TANKS.length, siteCode: SETTINGS.siteCode }
  );
  ledger = appendLedger(ledger, "Supervisor", "SHIFT_CLOSED", `Shift ${historicalShift1.id} closed and signed`, { shiftId: historicalShift1.id });
  ledger = appendLedger(ledger, "Supervisor", "SHIFT_CLOSED", `Shift ${closedShift.id} closed and signed`, { shiftId: closedShift.id });
  ledger = appendLedger(ledger, "Attendant", "SHIFT_OPENED", `Shift ${openShift.id} opened`, { shiftId: openShift.id });

  const initialDips: AppState["dips"] = [
    {
      id: "D-INIT-1",
      ts: iso(yesterday),
      tankId: "T1",
      cm: 168.4,
      litres: 26900,
      waterCm: 0,
      waterLitres: 0,
      kind: "CLOSING",
      dipstickType: "wooden",
      role: "Supervisor",
    },
    {
      id: "D-INIT-2",
      ts: iso(yesterday),
      tankId: "T2",
      cm: 106.1,
      litres: 16190,
      waterCm: 0.3,
      waterLitres: 0,
      kind: "CLOSING",
      dipstickType: "wooden",
      role: "Supervisor",
    },
    {
      id: "D-INIT-3",
      ts: iso(yesterday),
      tankId: "T3",
      cm: 101.8,
      litres: 8790,
      waterCm: 0,
      waterLitres: 0,
      kind: "CLOSING",
      dipstickType: "wooden",
      role: "Supervisor",
    },
  ];

  const defaultSiteData: SiteOperationalData = {
    tanks: TANKS,
    nozzles: DEFAULT_NOZZLES,
    dips: initialDips,
    shifts: [historicalShift1, closedShift, openShift],
    tickets: [],
    completedDrills: {},
    trainingSignoffs: [],
    ohsChecklistMarks: {},
  };

  return {
    version: 1,
    activeSiteId: DEFAULT_SITE_PROFILE.id,
    sites: [DEFAULT_SITE_PROFILE],
    siteDataById: {
      [DEFAULT_SITE_PROFILE.id]: defaultSiteData,
    },
    settings: SETTINGS,
    tanks: defaultSiteData.tanks,
    nozzles: defaultSiteData.nozzles,
    dips: defaultSiteData.dips,
    shifts: defaultSiteData.shifts,
    ledger,
    tickets: defaultSiteData.tickets,
    completedDrills: defaultSiteData.completedDrills,
    trainingSignoffs: defaultSiteData.trainingSignoffs,
    ohsChecklistMarks: defaultSiteData.ohsChecklistMarks,
  };
}
