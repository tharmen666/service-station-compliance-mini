import { appendLedger } from "./ledger";
import type { AppState, Shift, Tank, Settings } from "./types";

export const SETTINGS: Settings = {
  stationName: "East Africa Pilot Forecourt 01",
  country: "Kenya",
  currency: "KES",
  role: "Station Manager",
  lang: "en",
  tenant: "neutral",
  volumetricTolPct: 0.3,
  deliveryTolPct: 0.5,
  thresholds: { KES: 1500, TZS: 28000, UGX: 40000, RWF: 15000 },
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

const NOW = new Date();
const iso = (d: Date) => d.toISOString();
const yesterday = new Date(NOW.getTime() - 24 * 3600 * 1000);

// Yesterday's shift: closed and signed. Variance within tolerance.
const closedShift: Shift = {
  id: "S-0001",
  openedAt: iso(new Date(yesterday.getTime() - 8 * 3600 * 1000)),
  closedAt: iso(yesterday),
  status: "CLOSED",
  openingL: { T1: 21400, T2: 18950, T3: 9800 },
  deliveries: [
    { tankId: "T1", preDropL: 8600, postDropL: 18600, omnicommL: 10000, waybillNo: "WB-44021", gpsArrivalIso: iso(yesterday) },
  ],
  meters: [
    { id: "N1", name: "PMS-1", tankId: "T1", open: 120450, close: 124010 },
    { id: "N2", name: "PMS-2", tankId: "T1", open: 98210, close: 100950 },
    { id: "N3", name: "AGO-1", tankId: "T2", open: 66120, close: 68780 },
    { id: "N4", name: "IK-1", tankId: "T3", open: 40210, close: 40990 },
  ],
  closingL: { T1: 26900, T2: 16190, T3: 8790 },
  atgL: { T1: 26880, T2: 16205, T3: 8785 },
  prices: { T1: 183, T2: 170, T3: 150 },
  cash: { cash: 412000, mobileMoney: 318500, card: 27000 },
  investigation: null,
  signOff: { name: "Grace Wanjiru", role: "Supervisor", ts: iso(yesterday) },
};

// Today's shift: open, with meters but no closing dips yet.
const openShift: Shift = {
  id: "S-0002",
  openedAt: iso(NOW),
  closedAt: null,
  status: "OPEN",
  openingL: { T1: 26900, T2: 16190, T3: 8790 },
  deliveries: [],
  meters: [
    { id: "N1", name: "PMS-1", tankId: "T1", open: 124010, close: 124010 },
    { id: "N2", name: "PMS-2", tankId: "T1", open: 100950, close: 100950 },
    { id: "N3", name: "AGO-1", tankId: "T2", open: 68780, close: 68780 },
    { id: "N4", name: "IK-1", tankId: "T3", open: 40990, close: 40990 },
  ],
  closingL: {},
  atgL: {},
  prices: { T1: 183, T2: 170, T3: 150 },
  cash: { cash: 0, mobileMoney: 0, card: 0 },
  investigation: null,
  signOff: null,
};

export function buildSampleState(): AppState {
  let ledger: AppState["ledger"] = [];
  ledger = appendLedger(ledger, "Station Manager", "SAMPLE_LOAD", "East Africa Pilot Forecourt 01 sample loaded", { tanks: TANKS.length });
  ledger = appendLedger(ledger, "Supervisor", "SHIFT_CLOSED", `Shift ${closedShift.id} closed and signed`, { shiftId: closedShift.id });
  ledger = appendLedger(ledger, "Attendant", "SHIFT_OPENED", `Shift ${openShift.id} opened`, { shiftId: openShift.id });

  return {
    version: 1,
    settings: SETTINGS,
    tanks: TANKS,
    nozzles: [],
    dips: [],
    shifts: [closedShift, openShift],
    ledger,
    tickets: [],
    completedDrills: {},
    trainingSignoffs: [],
  };
}
