import type { ChartPoint, Currency, Settings, Shift, Tank } from "./types";

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

export interface TankRecon {
  tankId: string;
  product: string;
  openingL: number;
  deliveredL: number;
  dispensedL: number;
  theoreticalL: number;
  closingL: number | null;
  varianceL: number | null;
  tolL: number;
  price: number;
  varianceValue: number | null;
  flags: string[];
  locked: boolean;
}

export interface ShiftRecon {
  tanks: TankRecon[];
  currency: Currency;
  expectedRevenue: number;
  collected: number;
  shortfall: number;
  cashThreshold: number;
  reasons: string[];
  locked: boolean;
  allClosingEntered: boolean;
}

/**
 * Deterministic wetstock reconciliation.
 *  Theoretical = Opening + Deliveries (post-drop minus pre-drop) - Pump meter sales
 *  Variance    = Physical closing dip - Theoretical
 *  Lock if |variance| > volumetric tolerance (% of dispensed litres),
 *       or |variance x pump price| > petty threshold for the local currency,
 *       or |cash shortfall| > petty threshold, or a meter reads backwards,
 *       or a delivery is short against Omnicomm dispatch beyond delivery tolerance.
 */
export function computeShiftRecon(shift: Shift, tanks: Tank[], settings: Settings): ShiftRecon {
  const reasons: string[] = [];
  const threshold = settings.thresholds[settings.currency];

  const tankRecons: TankRecon[] = tanks.map((tank) => {
    const flags: string[] = [];
    const openingL = shift.openingL[tank.id] ?? 0;
    const deliveries = shift.deliveries.filter((d) => d.tankId === tank.id);
    const deliveredL = deliveries.reduce((s, d) => s + (d.postDropL - d.preDropL), 0);

    for (const d of deliveries) {
      if (d.omnicommL && d.omnicommL > 0) {
        const received = d.postDropL - d.preDropL;
        const pct = (Math.abs(received - d.omnicommL) / d.omnicommL) * 100;
        if (pct > settings.deliveryTolPct) {
          flags.push(`Delivery ${d.waybillNo || ""} differs from Omnicomm dispatch by ${pct.toFixed(2)}%`);
        }
      }
      if (d.postDropL < d.preDropL) flags.push("Post-drop dip is lower than pre-drop dip");
    }

    const meters = shift.meters.filter((m) => m.tankId === tank.id);
    let dispensedL = 0;
    for (const m of meters) {
      if (m.close < m.open) flags.push(`Meter ${m.name} reads backwards`);
      else dispensedL += m.close - m.open;
    }

    const price = shift.prices[tank.id] ?? 0;
    const theoreticalL = openingL + deliveredL - dispensedL;
    const closingRaw = shift.closingL[tank.id];
    const closingL = typeof closingRaw === "number" ? closingRaw : null;
    const varianceL = closingL === null ? null : closingL - theoreticalL;
    const tolL = (dispensedL * settings.volumetricTolPct) / 100;
    const varianceValue = varianceL === null ? null : varianceL * price;

    let locked = flags.length > 0;
    if (varianceL !== null && Math.abs(varianceL) > tolL) locked = true;
    if (varianceValue !== null && Math.abs(varianceValue) > threshold) locked = true;

    if (varianceL !== null && Math.abs(varianceL) > tolL) {
      reasons.push(`${tank.name}: variance ${varianceL.toFixed(1)} L exceeds volumetric tolerance`);
    }
    if (varianceValue !== null && Math.abs(varianceValue) > threshold) {
      reasons.push(`${tank.name}: variance value exceeds ${settings.currency} ${threshold.toLocaleString()}`);
    }
    flags.forEach((f) => reasons.push(`${tank.name}: ${f}`));

    return {
      tankId: tank.id,
      product: tank.product,
      openingL,
      deliveredL,
      dispensedL,
      theoreticalL,
      closingL,
      varianceL,
      tolL,
      price,
      varianceValue,
      flags,
      locked,
    };
  });

  const expectedRevenue = tankRecons.reduce((s, t) => s + t.dispensedL * t.price, 0);
  const collected = shift.cash.cash + shift.cash.mobileMoney + shift.cash.card;
  const shortfall = expectedRevenue - collected;
  if (Math.abs(shortfall) > threshold) {
    reasons.push(`Cash-up difference ${settings.currency} ${Math.round(shortfall).toLocaleString()}`);
  }

  return {
    tanks: tankRecons,
    currency: settings.currency,
    expectedRevenue,
    collected,
    shortfall,
    cashThreshold: threshold,
    reasons,
    locked: reasons.length > 0,
    allClosingEntered: tankRecons.every((t) => t.closingL !== null),
  };
}
