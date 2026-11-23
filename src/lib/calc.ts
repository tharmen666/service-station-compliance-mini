import type {
  ChartPoint,
  Currency,
  DipReading,
  GaugingMode,
  Settings,
  Shift,
  Tank,
} from "./types";

/** Horizontal cylinder: litres at a wet dip of hCm (cm). Clamped to 0..diameter. */
export function geometryLitres(diameterCm: number, lengthCm: number, hCm: number): number {
  const r = diameterCm / 2;
  const h = Math.min(Math.max(hCm, 0), 2 * r);
  const x = (r - h) / r; // within [-1, 1] after clamp
  const cm3 = lengthCm * (r * r * Math.acos(x) - (r - h) * Math.sqrt(Math.max(0, 2 * r * h - h * h)));
  return cm3 / 1000;
}

/** Linear interpolation on a strapping chart (cm -> litres). Clamped at both ends. */
export function tableLitres(points: ChartPoint[], cm: number): number {
  const p = [...points].sort((a, b) => a.cm - b.cm);
  if (p.length === 0) return 0;
  if (cm <= p[0].cm) return p[0].litres;
  if (cm >= p[p.length - 1].cm) return p[p.length - 1].litres;
  for (let i = 1; i < p.length; i++) {
    if (cm <= p[i].cm) {
      const a = p[i - 1];
      const b = p[i];
      const t = (cm - a.cm) / (b.cm - a.cm);
      return a.litres + t * (b.litres - a.litres);
    }
  }
  return p[p.length - 1].litres;
}

export function litresFromCm(tank: Tank, cm: number): number {
  const c = tank.calibration;
  const raw =
    c.mode === "geometry"
      ? geometryLitres(c.diameterCm, c.lengthCm, cm)
      : tableLitres(c.points, cm);
  return Math.round(raw * 10) / 10;
}

export function maxCm(tank: Tank): number {
  const c = tank.calibration;
  if (c.mode === "geometry") return c.diameterCm;
  return c.points.length ? Math.max(...c.points.map((p) => p.cm)) : 0;
}

/** Full-tank geometric volume, used to sanity-check the entered capacity. */
export function geometryCapacityL(tank: Tank): number | null {
  const c = tank.calibration;
  if (c.mode !== "geometry") return null;
  return Math.round(geometryLitres(c.diameterCm, c.lengthCm, c.diameterCm));
}

/** Parses "cm,litres" lines. Returns points or a list of human-readable errors. */
export function parseChart(text: string): { points: ChartPoint[]; errors: string[] } {
  const points: ChartPoint[] = [];
  const errors: string[] = [];
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const [cmRaw, lRaw] = line.split(/[,;\t]/).map((s) => s.trim());
      const cm = Number(cmRaw);
      const litres = Number(lRaw);
      if (!Number.isFinite(cm) || !Number.isFinite(litres) || cmRaw === "" || lRaw === undefined) {
        errors.push(`Line ${i + 1}: expected "cm,litres"`);
      } else {
        points.push({ cm, litres });
      }
    });
  if (points.length < 2) errors.push("At least 2 chart points are required");
  return { points, errors };
}

export type TriggerId =
  | "SINGLE_SHIFT_VARIANCE"
  | "CUMULATIVE_LOSS_TREND"
  | "WATER_INGRESS"
  | "DELIVERY_ULLAGE"
  | "ACCOUNTABILITY_GATE";

export type TriggerStatus = "PASS" | "WARN" | "BREACH" | "PENDING";

export interface WetstockTrigger {
  id: TriggerId;
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  status: TriggerStatus;
  blocksClose: boolean;
  metric: string;
  detail: string;
  affectedTanks: string[];
}

export interface CumulativeTankTrend {
  tankId: string;
  tankName: string;
  consecutiveLossShifts: number;
  rollingVarianceL: number;
  shiftsSampled: number;
}

export interface NormalizedTankInput {
  tankId: string;
  openingL: number;
  deliveredL: number;
  dispensedL: number;
  closingL: number | null;
  closingSource: "MANUAL" | "ATG" | "NONE";
  waterMm: number | null;
  meterFlags: string[];
}

export interface TankRecon {
  tankId: string;
  product: string;
  openingL: number;
  deliveredL: number;
  dispensedL: number;
  theoreticalL: number;
  closingL: number | null;
  closingSource: "MANUAL" | "ATG" | "NONE";
  varianceL: number | null;
  variancePct: number | null;
  tolL: number;
  tolPct: number;
  price: number;
  varianceValue: number | null;
  waterMm: number | null;
  flags: string[];
  locked: boolean;
}

export interface ShiftRecon {
  gaugingMode: GaugingMode;
  tanks: TankRecon[];
  currency: Currency;
  expectedRevenue: number;
  collected: number;
  shortfall: number;
  cashThreshold: number;
  reasons: string[];
  locked: boolean;
  allClosingEntered: boolean;
  triggers: WetstockTrigger[];
  cumulativeTrends: CumulativeTankTrend[];
  blockingTriggersCount: number;
}

/**
 * Normalizes Manual Dipstick, Hybrid (Manual + POS), and Electronic ATG readings
 * into identical per-tank volumetric inputs for the deterministic engine.
 */
export function normalizeShiftInputs(
  shift: Shift,
  tanks: Tank[],
  dips: DipReading[] = []
): Record<string, NormalizedTankInput> {
  const mode: GaugingMode = shift.gaugingMode ?? "MANUAL";
  const out: Record<string, NormalizedTankInput> = {};

  for (const tank of tanks) {
    const openingL = shift.openingL[tank.id] ?? 0;
    const deliveries = shift.deliveries.filter((d) => d.tankId === tank.id);
    const deliveredL = deliveries.reduce((s, d) => s + (d.postDropL - d.preDropL), 0);

    const meters = shift.meters.filter((m) => m.tankId === tank.id);
    const meterFlags: string[] = [];
    let meterDispensedL = 0;
    for (const m of meters) {
      if (m.close < m.open) meterFlags.push(`Meter ${m.name} reads backwards`);
      else meterDispensedL += m.close - m.open;
    }

    const posOverride = shift.posSalesL?.[tank.id];
    const dispensedL =
      mode === "HYBRID" && typeof posOverride === "number" && Number.isFinite(posOverride)
        ? Math.max(0, posOverride)
        : meterDispensedL;

    const manualRaw = shift.closingL?.[tank.id];
    const atgRaw = shift.atgL?.[tank.id];
    let closingL: number | null = null;
    let closingSource: "MANUAL" | "ATG" | "NONE" = "NONE";

    if (mode === "ATG") {
      if (typeof atgRaw === "number" && Number.isFinite(atgRaw)) {
        closingL = atgRaw;
        closingSource = "ATG";
      } else if (typeof manualRaw === "number" && Number.isFinite(manualRaw)) {
        closingL = manualRaw;
        closingSource = "MANUAL";
      }
    } else if (typeof manualRaw === "number" && Number.isFinite(manualRaw)) {
      closingL = manualRaw;
      closingSource = "MANUAL";
    }

    let waterMm: number | null = null;
    const shiftWater = shift.waterMm?.[tank.id];
    if (typeof shiftWater === "number" && Number.isFinite(shiftWater)) {
      waterMm = shiftWater;
    } else {
      const latestDipWithWater = [...dips]
        .reverse()
        .find((d) => d.tankId === tank.id && typeof d.waterCm === "number" && Number.isFinite(d.waterCm));
      if (latestDipWithWater && latestDipWithWater.waterCm !== null) {
        waterMm = Math.round(latestDipWithWater.waterCm * 10 * 10) / 10;
      }
    }

    out[tank.id] = {
      tankId: tank.id,
      openingL,
      deliveredL,
      dispensedL,
      closingL,
      closingSource,
      waterMm,
      meterFlags,
    };
  }

  return out;
}

function quickTankVariance(shift: Shift, tank: Tank): number | null {
  const mode: GaugingMode = shift.gaugingMode ?? "MANUAL";
  const closingRaw = mode === "ATG" ? shift.atgL?.[tank.id] ?? shift.closingL?.[tank.id] : shift.closingL?.[tank.id];
  if (typeof closingRaw !== "number" || !Number.isFinite(closingRaw)) return null;

  const openingL = shift.openingL[tank.id] ?? 0;
  const deliveredL = shift.deliveries
    .filter((d) => d.tankId === tank.id)
    .reduce((s, d) => s + (d.postDropL - d.preDropL), 0);

  const posOverride = shift.posSalesL?.[tank.id];
  const dispensedL =
    mode === "HYBRID" && typeof posOverride === "number" && Number.isFinite(posOverride)
      ? Math.max(0, posOverride)
      : shift.meters
        .filter((m) => m.tankId === tank.id && m.close >= m.open)
        .reduce((s, m) => s + (m.close - m.open), 0);

  const theoreticalL = openingL + deliveredL - dispensedL;
  return closingRaw - theoreticalL;
}

/**
 * Deterministic wetstock reconciliation + 5-Trigger Accountability Engine.
 *  Theoretical = Opening + Deliveries (post-drop minus pre-drop) - Dispensed volume
 *  Variance    = Physical/ATG closing volume - Theoretical
 */
export function computeShiftRecon(
  shift: Shift,
  tanks: Tank[],
  settings: Settings,
  allShifts: Shift[] = [],
  dips: DipReading[] = []
): ShiftRecon {
  const gaugingMode: GaugingMode = shift.gaugingMode ?? "MANUAL";
  const normalized = normalizeShiftInputs(shift, tanks, dips);
  const reasons: string[] = [];
  const threshold = settings.thresholds[settings.currency];
  const waterThresholdMm = settings.waterThresholdMm ?? 15;

  const deliveryBreachMessages: string[] = [];
  const deliveryAffectedTanks = new Set<string>();

  const tankRecons: TankRecon[] = tanks.map((tank) => {
    const norm = normalized[tank.id];
    const flags: string[] = [...norm.meterFlags];
    const deliveries = shift.deliveries.filter((d) => d.tankId === tank.id);

    for (const d of deliveries) {
      const received = d.postDropL - d.preDropL;
      const expectedDrop = d.deliveryNoteL ?? d.omnicommL;
      if (expectedDrop && expectedDrop > 0) {
        const pct = (Math.abs(received - expectedDrop) / expectedDrop) * 100;
        if (pct > settings.deliveryTolPct) {
          const msg = `Delivery ${d.waybillNo || ""} differs from delivery note/dispatch by ${pct.toFixed(2)}%`;
          flags.push(msg);
          deliveryBreachMessages.push(`${tank.name}: ${msg}`);
          deliveryAffectedTanks.add(tank.name);
        }
      }
      if (d.postDropL < d.preDropL) {
        const msg = "Post-drop dip is lower than pre-drop dip";
        flags.push(msg);
        deliveryBreachMessages.push(`${tank.name}: ${msg}`);
        deliveryAffectedTanks.add(tank.name);
      }
      if (tank.capacityL > 0 && d.postDropL > tank.capacityL) {
        const msg = `Post-drop volume (${Math.round(d.postDropL).toLocaleString()} L) exceeds tank capacity (${tank.capacityL.toLocaleString()} L) — ullage breach`;
        flags.push(msg);
        deliveryBreachMessages.push(`${tank.name}: ${msg}`);
        deliveryAffectedTanks.add(tank.name);
      }
    }

    const price = shift.prices[tank.id] ?? 0;
    const theoreticalL = norm.openingL + norm.deliveredL - norm.dispensedL;
    const closingL = norm.closingL;
    const varianceL = closingL === null ? null : closingL - theoreticalL;

    const baseVolumeForPct = norm.dispensedL > 0 ? norm.dispensedL : norm.openingL + norm.deliveredL;
    const variancePct =
      varianceL === null ? null : baseVolumeForPct > 0 ? (varianceL / baseVolumeForPct) * 100 : 0;

    const tolL = (baseVolumeForPct * settings.volumetricTolPct) / 100;
    const varianceValue = varianceL === null ? null : varianceL * price;

    const pctBreach = variancePct !== null && Math.abs(variancePct) > settings.volumetricTolPct;
    const volBreach = varianceL !== null && Math.abs(varianceL) > tolL;
    const valBreach = varianceValue !== null && Math.abs(varianceValue) > threshold;

    let locked = flags.length > 0 || pctBreach || volBreach || valBreach;
    if (norm.waterMm !== null && norm.waterMm > waterThresholdMm) {
      locked = true;
    }

    if (pctBreach || volBreach) {
      reasons.push(
        `${tank.name}: variance ${varianceL!.toFixed(1)} L (${variancePct!.toFixed(2)}%) exceeds ±${settings.volumetricTolPct.toFixed(2)}% tolerance`
      );
    }
    if (valBreach) {
      reasons.push(`${tank.name}: variance value exceeds ${settings.currency} ${threshold.toLocaleString()}`);
    }
    flags.forEach((f) => reasons.push(`${tank.name}: ${f}`));

    return {
      tankId: tank.id,
      product: tank.product,
      openingL: norm.openingL,
      deliveredL: norm.deliveredL,
      dispensedL: norm.dispensedL,
      theoreticalL,
      closingL,
      closingSource: norm.closingSource,
      varianceL,
      variancePct,
      tolL,
      tolPct: settings.volumetricTolPct,
      price,
      varianceValue,
      waterMm: norm.waterMm,
      flags,
      locked,
    };
  });

  // Trigger 1: Single-Shift Variance Breach
  const enteredTanks = tankRecons.filter((r) => r.varianceL !== null);
  const varianceBreachTanks = enteredTanks.filter(
    (r) =>
      Math.abs(r.variancePct ?? 0) > settings.volumetricTolPct ||
      Math.abs(r.varianceL ?? 0) > r.tolL ||
      Math.abs(r.varianceValue ?? 0) > threshold
  );
  const worstVarianceTank = [...enteredTanks].sort(
    (a, b) => Math.abs(b.variancePct ?? 0) - Math.abs(a.variancePct ?? 0)
  )[0];

  const trigger1: WetstockTrigger = {
    id: "SINGLE_SHIFT_VARIANCE",
    number: 1,
    title: "Single-Shift Variance Breach",
    status:
      enteredTanks.length === 0
        ? "PENDING"
        : varianceBreachTanks.length > 0
          ? "BREACH"
          : "PASS",
    blocksClose: varianceBreachTanks.length > 0,
    metric:
      enteredTanks.length === 0
        ? "Awaiting closing read"
        : `Peak ${worstVarianceTank.variancePct! >= 0 ? "+" : ""}${worstVarianceTank.variancePct!.toFixed(2)}% (limit ±${settings.volumetricTolPct.toFixed(2)}%)`,
    detail:
      enteredTanks.length === 0
        ? "Enter physical dipstick or ATG closing volumes to evaluate ±0.50% tolerance."
        : varianceBreachTanks.length > 0
          ? `${varianceBreachTanks.length} tank(s) exceeded ±${settings.volumetricTolPct.toFixed(2)}% / currency threshold.`
          : `All ${enteredTanks.length} measured tank(s) within ±${settings.volumetricTolPct.toFixed(2)}% volumetric tolerance.`,
    affectedTanks: varianceBreachTanks.map((r) => tanks.find((t) => t.id === r.tankId)?.name ?? r.tankId),
  };

  // Trigger 2: Cumulative Multi-Shift Loss Trend (rolling history across closed shifts + current)
  const priorClosed = allShifts
    .filter((s) => s.status === "CLOSED" && s.id !== shift.id)
    .sort((a, b) => Date.parse(a.openedAt) - Date.parse(b.openedAt));

  const cumulativeTrends: CumulativeTankTrend[] = tanks.map((tank) => {
    const historyVariances = priorClosed
      .map((sh) => quickTankVariance(sh, tank))
      .filter((v): v is number => v !== null);
    const currentRecon = tankRecons.find((r) => r.tankId === tank.id);
    if (currentRecon && currentRecon.varianceL !== null) {
      historyVariances.push(currentRecon.varianceL);
    }

    const recent = historyVariances.slice(-5);
    let consecutiveLossShifts = 0;
    for (let i = recent.length - 1; i >= 0; i--) {
      if (recent[i] < -5) consecutiveLossShifts++;
      else break;
    }
    const rollingVarianceL = recent.reduce((acc, v) => acc + v, 0);

    return {
      tankId: tank.id,
      tankName: tank.name,
      consecutiveLossShifts,
      rollingVarianceL,
      shiftsSampled: recent.length,
    };
  });

  const leakBreachTrends = cumulativeTrends.filter(
    (tr) => tr.consecutiveLossShifts >= 3 || (tr.consecutiveLossShifts >= 2 && tr.rollingVarianceL <= -150)
  );
  const leakWarnTrends = cumulativeTrends.filter(
    (tr) =>
      !leakBreachTrends.includes(tr) &&
      (tr.consecutiveLossShifts >= 2 || tr.rollingVarianceL <= -50)
  );
  const worstTrend = [...cumulativeTrends].sort((a, b) => a.rollingVarianceL - b.rollingVarianceL)[0];

  if (leakBreachTrends.length > 0) {
    reasons.push(
      `Cumulative multi-shift loss trend on ${leakBreachTrends.map((t) => t.tankName).join(", ")} (suspected slow underground leak)`
    );
  }

  const trigger2: WetstockTrigger = {
    id: "CUMULATIVE_LOSS_TREND",
    number: 2,
    title: "Cumulative Multi-Shift Loss Trend",
    status:
      leakBreachTrends.length > 0
        ? "BREACH"
        : leakWarnTrends.length > 0
          ? "WARN"
          : "PASS",
    blocksClose: leakBreachTrends.length > 0,
    metric: worstTrend
      ? `${worstTrend.consecutiveLossShifts} consec. loss · ${worstTrend.rollingVarianceL >= 0 ? "+" : ""}${worstTrend.rollingVarianceL.toFixed(0)} L (${worstTrend.shiftsSampled} shifts)`
      : "No shift history",
    detail:
      leakBreachTrends.length > 0
        ? `Consecutive negative variances indicate potential slow UST leak / groundwater contamination risk.`
        : leakWarnTrends.length > 0
          ? `Early downward drift detected (${leakWarnTrends.map((t) => t.tankName).join(", ")}). Monitor next closing dip closely.`
          : `Rolling multi-shift wetstock balance stable across ${Math.max(1, worstTrend?.shiftsSampled ?? 1)} shift(s).`,
    affectedTanks: [...leakBreachTrends, ...leakWarnTrends].map((t) => t.tankName),
  };

  // Trigger 3: Water Ingress / Phase Separation Alert
  const waterBreaches = tankRecons.filter((r) => r.waterMm !== null && r.waterMm > waterThresholdMm);
  const waterWarns = tankRecons.filter(
    (r) => r.waterMm !== null && r.waterMm > 0 && r.waterMm <= waterThresholdMm
  );
  const maxWaterMm = tankRecons.reduce((mx, r) => Math.max(mx, r.waterMm ?? 0), 0);

  if (waterBreaches.length > 0) {
    waterBreaches.forEach((r) => {
      const name = tanks.find((t) => t.id === r.tankId)?.name ?? r.tankId;
      reasons.push(`${name}: water ingress ${r.waterMm!.toFixed(1)} mm exceeds ${waterThresholdMm} mm safe threshold`);
    });
  }

  const trigger3: WetstockTrigger = {
    id: "WATER_INGRESS",
    number: 3,
    title: "Water Ingress / Phase Separation Alert",
    status:
      waterBreaches.length > 0
        ? "BREACH"
        : waterWarns.length > 0
          ? "WARN"
          : "PASS",
    blocksClose: waterBreaches.length > 0,
    metric: `Max ${maxWaterMm.toFixed(1)} mm (limit ${waterThresholdMm} mm)`,
    detail:
      waterBreaches.length > 0
        ? `Water level exceeds ${waterThresholdMm} mm safe threshold — risk of phase separation, fuel contamination, or UST ingress.`
        : waterWarns.length > 0
          ? `Trace water detected (≤ ${waterThresholdMm} mm). Drain water bottom and verify seal integrity.`
          : `All tanks clear (0.0 mm water paste / ATG water).`,
    affectedTanks: [...waterBreaches, ...waterWarns].map(
      (r) => tanks.find((t) => t.id === r.tankId)?.name ?? r.tankId
    ),
  };

  // Trigger 4: Delivery & Ullage Discrepancy
  const deliveryCount = shift.deliveries.length;
  const trigger4: WetstockTrigger = {
    id: "DELIVERY_ULLAGE",
    number: 4,
    title: "Delivery & Ullage Discrepancy",
    status: deliveryBreachMessages.length > 0 ? "BREACH" : "PASS",
    blocksClose: deliveryBreachMessages.length > 0,
    metric:
      deliveryCount === 0
        ? "0 deliveries logged"
        : `${deliveryCount} delivery · ${deliveryBreachMessages.length} flag(s)`,
    detail:
      deliveryBreachMessages.length > 0
        ? deliveryBreachMessages.join(" | ")
        : deliveryCount === 0
          ? "No tanker offloads recorded in this shift."
          : `All ${deliveryCount} tanker delivery note(s) & ullage margins reconciled within ±${settings.deliveryTolPct.toFixed(2)}%.`,
    affectedTanks: Array.from(deliveryAffectedTanks),
  };

  // Cash-up evaluation
  const expectedRevenue = tankRecons.reduce((s, t) => s + t.dispensedL * t.price, 0);
  const collected = shift.cash.cash + shift.cash.mobileMoney + shift.cash.card;
  const shortfall = expectedRevenue - collected;
  if (Math.abs(shortfall) > threshold) {
    reasons.push(`Cash-up difference ${settings.currency} ${Math.round(shortfall).toLocaleString()}`);
  }

  const anyPreGateLock = reasons.length > 0;
  const investigated = shift.investigation !== null;

  // Trigger 5: High-Shortage Accountability Gate
  const trigger5: WetstockTrigger = {
    id: "ACCOUNTABILITY_GATE",
    number: 5,
    title: "High-Shortage Accountability Gate",
    status: !anyPreGateLock ? "PASS" : investigated ? "WARN" : "BREACH",
    blocksClose: anyPreGateLock && !investigated,
    metric: !anyPreGateLock
      ? "Gate Clear"
      : investigated
        ? `Logged: ${shift.investigation!.cause}`
        : "Sign-off LOCKED",
    detail: !anyPreGateLock
      ? "No critical shortage or environmental breach active. Supervisor Name & ID seals SHA-256 sign-off."
      : investigated
        ? `Root-cause recorded (${shift.investigation!.cause}). Enter Supervisor Name & ID to seal shift with SHA-256 hash.`
        : "Close & Sign Shift is locked until mandatory Root-Cause Classification and Supervisor Name/ID are recorded.",
    affectedTanks: [],
  };

  const triggers = [trigger1, trigger2, trigger3, trigger4, trigger5];
  const blockingTriggersCount = triggers.filter((t) => t.blocksClose).length;

  return {
    gaugingMode,
    tanks: tankRecons,
    currency: settings.currency,
    expectedRevenue,
    collected,
    shortfall,
    cashThreshold: threshold,
    reasons,
    locked: reasons.length > 0,
    allClosingEntered: tankRecons.every((t) => t.closingL !== null),
    triggers,
    cumulativeTrends,
    blockingTriggersCount,
  };
}
