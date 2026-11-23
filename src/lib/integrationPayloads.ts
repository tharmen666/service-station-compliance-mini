import type { ShiftRecon } from "./calc";
import { sha256Hex } from "./sha256";
import type { GaugingMode, LedgerEntry, Settings, Shift, Tank } from "./types";

function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildShiftAuditJson(
  shift: Shift,
  recon: ShiftRecon,
  tanks: Tank[],
  settings: Settings,
  ledger: LedgerEntry[]
): string {
  const tankName = (id: string) => tanks.find((t) => t.id === id)?.name ?? id;
  const payload = {
    schema: "gear.wetstock.shift_audit.v1",
    generatedAt: new Date().toISOString(),
    station: {
      name: settings.stationName,
      brandNetwork: settings.brandNetwork,
      siteCode: settings.siteCode,
      physicalAddress: settings.physicalAddress,
      country: settings.country,
      currency: settings.currency,
      section162Manager: settings.section162Manager,
      emergencyContact: settings.emergencyContact,
      tankCount: settings.tankCount,
      dispenserCount: settings.dispenserCount,
      volumetricTolerancePct: settings.volumetricTolPct,
      deliveryTolerancePct: settings.deliveryTolPct,
      waterThresholdMm: settings.waterThresholdMm ?? 15,
    },
    shift: {
      id: shift.id,
      status: shift.status,
      gaugingMode: recon.gaugingMode,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      atgTelemetryMeta: shift.atgTelemetryMeta ?? null,
      investigation: shift.investigation,
      signOff: shift.signOff,
    },
    reconciliation: {
      locked: recon.locked,
      allClosingEntered: recon.allClosingEntered,
      expectedRevenue: Math.round(recon.expectedRevenue * 100) / 100,
      collectedRevenue: Math.round(recon.collected * 100) / 100,
      shortfall: Math.round(recon.shortfall * 100) / 100,
      tanks: recon.tanks.map((r) => ({
        tankId: r.tankId,
        tankName: tankName(r.tankId),
        product: r.product,
        openingL: r.openingL,
        deliveredL: r.deliveredL,
        dispensedL: r.dispensedL,
        theoreticalL: r.theoreticalL,
        closingL: r.closingL,
        closingSource: r.closingSource,
        varianceL: r.varianceL,
        variancePct: r.variancePct !== null ? Number(r.variancePct.toFixed(3)) : null,
        waterMm: r.waterMm,
        locked: r.locked,
        flags: r.flags,
      })),
    },
    triggers: recon.triggers,
    ledgerTipHash: ledger[ledger.length - 1]?.hash ?? null,
    ledgerEntriesCount: ledger.length,
  };
  return JSON.stringify(payload, null, 2);
}

export function buildErpCsv(
  shift: Shift,
  recon: ShiftRecon,
  tanks: Tank[],
  settings: Settings
): string {
  const headers = [
    "station_name",
    "site_code",
    "brand_network",
    "section_16_2_manager",
    "country",
    "currency",
    "shift_id",
    "shift_status",
    "gauging_mode",
    "tank_id",
    "tank_name",
    "product",
    "opening_l",
    "delivered_l",
    "dispensed_l",
    "theoretical_l",
    "closing_l",
    "closing_source",
    "variance_l",
    "variance_pct",
    "water_mm",
    "locked",
    "root_cause",
    "supervisor_name",
    "supervisor_id",
    "sha256_seal",
  ];
  const rows = recon.tanks.map((r) => {
    const tk = tanks.find((t) => t.id === r.tankId);
    return [
      settings.stationName,
      settings.siteCode,
      settings.brandNetwork,
      settings.section162Manager,
      settings.country,
      settings.currency,
      shift.id,
      shift.status,
      recon.gaugingMode,
      r.tankId,
      tk?.name ?? r.tankId,
      r.product,
      r.openingL,
      r.deliveredL,
      r.dispensedL,
      r.theoreticalL,
      r.closingL ?? "",
      r.closingSource,
      r.varianceL ?? "",
      r.variancePct !== null ? r.variancePct.toFixed(3) : "",
      r.waterMm ?? "",
      r.locked ? "YES" : "NO",
      shift.investigation?.cause ?? "",
      shift.signOff?.name ?? "",
      shift.signOff?.supervisorId ?? "",
      shift.signOff?.hash ?? "",
    ];
  });
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function buildWebhookPayload(
  shift: Shift,
  recon: ShiftRecon,
  tanks: Tank[],
  settings: Settings
): string {
  const body = {
    event: "forecourt.shift.wetstock_snapshot",
    version: "1.0",
    compatibleSystems: ["SAP", "Prizm", "Sage", "TitanCloud", "OMIS-4"],
    sentAt: new Date().toISOString(),
    stationName: settings.stationName,
    brandNetwork: settings.brandNetwork,
    siteCode: settings.siteCode,
    physicalAddress: settings.physicalAddress,
    section162Manager: settings.section162Manager,
    emergencyContact: settings.emergencyContact,
    tankCount: settings.tankCount,
    dispenserCount: settings.dispenserCount,
    country: settings.country,
    currency: settings.currency,
    shiftId: shift.id,
    gaugingMode: recon.gaugingMode,
    locked: recon.locked,
    blockingTriggers: recon.triggers.filter((t) => t.blocksClose).map((t) => t.id),
    totals: {
      expectedRevenue: Math.round(recon.expectedRevenue * 100) / 100,
      collected: Math.round(recon.collected * 100) / 100,
      shortfall: Math.round(recon.shortfall * 100) / 100,
    },
    tanks: recon.tanks.map((r) => ({
      tankId: r.tankId,
      tankName: tanks.find((t) => t.id === r.tankId)?.name ?? r.tankId,
      product: r.product,
      theoreticalL: r.theoreticalL,
      closingL: r.closingL,
      varianceL: r.varianceL,
      variancePct: r.variancePct !== null ? Number(r.variancePct.toFixed(3)) : null,
      waterMm: r.waterMm,
      locked: r.locked,
    })),
    investigation: shift.investigation,
    signOff: shift.signOff,
  };
  const signatureSha256 = sha256Hex(JSON.stringify(body));
  return JSON.stringify({ ...body, signatureSha256 }, null, 2);
}

export const SAMPLE_ATG_JSON = JSON.stringify(
  {
    probeSchema: "Veeder-Root-TLS / Gilbarco Standardized v1",
    stationId: "EA-PILOT-01",
    capturedAt: new Date().toISOString(),
    readings: [
      { tankId: "T1", closingL: 23392, waterMm: 2 },
      { tankId: "T2", closingL: 14485, waterMm: 4 },
      { tankId: "T3", closingL: 8291, waterMm: 0 },
    ],
  },
  null,
  2
);

export const SAMPLE_POS_JSON = JSON.stringify(
  {
    posSystem: "Generic Forecourt POS / Prizm Export",
    sales: [
      { tankId: "T1", dispensedL: 3500 },
      { tankId: "T2", dispensedL: 1700 },
      { tankId: "T3", dispensedL: 500 },
    ],
    cash: { cash: 510000, mobileMoney: 440000, card: 54500 },
  },
  null,
  2
);

export const SAMPLE_CSV = [
  "tank_id,closing_l,water_mm,pos_sales_l",
  "T1,23392,2,3500",
  "T2,14485,4,1700",
  "T3,8291,0,500",
].join("\n");

export type ParsedPayloadResult =
  | {
      ok: true;
      detectedMode: GaugingMode;
      patch: Partial<Shift>;
      summary: string[];
    }
  | {
      ok: false;
      errors: string[];
    };

export function parseInboundPayload(
  rawText: string,
  tanks: Tank[],
  shift: Shift
): ParsedPayloadResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, errors: ["Paste a JSON or CSV payload first."] };
  }

  const knownIds = new Set(tanks.map((t) => t.id.toUpperCase()));
  const nextClosingL = { ...shift.closingL };
  const nextAtgL = { ...shift.atgL };
  const nextWaterMm = { ...(shift.waterMm ?? {}) };
  const nextPosSalesL = { ...(shift.posSalesL ?? {}) };
  let nextCash = { ...shift.cash };
  const summary: string[] = [];

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { ok: false, errors: ["Invalid JSON syntax."] };
    }

    const root = Array.isArray(parsed) ? { readings: parsed } : (parsed as Record<string, unknown>);
    const readings = Array.isArray(root.readings)
      ? root.readings
      : Array.isArray(root.tanks)
      ? root.tanks
      : [];
    const sales = Array.isArray(root.sales) ? root.sales : [];

    let hasAtg = false;
    let hasPos = false;

    for (const item of readings) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const tankId = String(r.tankId ?? r.tank_id ?? "").trim();
      if (!tankId || !knownIds.has(tankId.toUpperCase())) continue;
      const canonicalId = tanks.find((t) => t.id.toUpperCase() === tankId.toUpperCase())!.id;

      const volRaw = r.closingL ?? r.volumeL ?? r.productVolumeL ?? r.closing_l;
      if (typeof volRaw === "number" && Number.isFinite(volRaw) && volRaw >= 0) {
        nextAtgL[canonicalId] = volRaw;
        nextClosingL[canonicalId] = volRaw;
        hasAtg = true;
        summary.push(`${canonicalId} closing: ${volRaw.toLocaleString()} L`);
      }

      const waterMmRaw =
        typeof r.waterMm === "number"
          ? r.waterMm
          : typeof r.water_mm === "number"
          ? r.water_mm
          : typeof r.waterCm === "number"
          ? r.waterCm * 10
          : typeof r.water_cm === "number"
          ? r.water_cm * 10
          : null;
      if (waterMmRaw !== null && Number.isFinite(waterMmRaw) && waterMmRaw >= 0) {
        nextWaterMm[canonicalId] = Math.round(waterMmRaw * 10) / 10;
        summary.push(`${canonicalId} water: ${nextWaterMm[canonicalId]} mm`);
      }

      const posRaw = r.dispensedL ?? r.posSalesL ?? r.pos_sales_l;
      if (typeof posRaw === "number" && Number.isFinite(posRaw) && posRaw >= 0) {
        nextPosSalesL[canonicalId] = posRaw;
        hasPos = true;
        summary.push(`${canonicalId} POS sales: ${posRaw.toLocaleString()} L`);
      }
    }

    for (const item of sales) {
      if (!item || typeof item !== "object") continue;
      const s = item as Record<string, unknown>;
      const tankId = String(s.tankId ?? s.tank_id ?? "").trim();
      const canonicalId = tanks.find((t) => t.id.toUpperCase() === tankId.toUpperCase())?.id;
      const litres = Number(s.dispensedL ?? s.litres ?? s.volumeL ?? s.pos_sales_l);
      if (canonicalId && Number.isFinite(litres) && litres >= 0) {
        nextPosSalesL[canonicalId] = litres;
        hasPos = true;
        summary.push(`${canonicalId} POS sales: ${litres.toLocaleString()} L`);
      }
    }

    if (root.cash && typeof root.cash === "object") {
      const c = root.cash as Record<string, unknown>;
      nextCash = {
        cash: typeof c.cash === "number" ? c.cash : nextCash.cash,
        mobileMoney: typeof c.mobileMoney === "number" ? c.mobileMoney : nextCash.mobileMoney,
        card: typeof c.card === "number" ? c.card : nextCash.card,
      };
      summary.push("Cash/Mobile/Card totals updated");
    }

    if (summary.length === 0) {
      return {
        ok: false,
        errors: [
          `No matching tank records found. Expected tankId in [${tanks.map((t) => t.id).join(", ")}] inside readings[], tanks[], or sales[].`,
        ],
      };
    }

    const detectedMode: GaugingMode = hasAtg ? "ATG" : hasPos ? "HYBRID" : shift.gaugingMode ?? "MANUAL";
    return {
      ok: true,
      detectedMode,
      patch: {
        gaugingMode: detectedMode,
        atgL: nextAtgL,
        closingL: nextClosingL,
        waterMm: nextWaterMm,
        posSalesL: nextPosSalesL,
        cash: nextCash,
        atgTelemetryMeta: hasAtg
          ? {
              source: String(root.probeSchema ?? root.stationId ?? "Imported ATG JSON"),
              capturedAt: typeof root.capturedAt === "string" ? root.capturedAt : new Date().toISOString(),
              probeSchema: String(root.probeSchema ?? "Standardized ATG JSON"),
            }
          : shift.atgTelemetryMeta,
      },
      summary,
    };
  }

  // CSV mode
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  if (lines.length < 2) {
    return { ok: false, errors: ["CSV must have a header row and at least one data row."] };
  }

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idxTank = headers.findIndex((h) => h === "tank_id" || h === "tankid");
  if (idxTank < 0) {
    return { ok: false, errors: ["CSV header must include tank_id (or tankId)."] };
  }
  const idxClose = headers.findIndex((h) => h === "closing_l" || h === "volumel" || h === "closingl");
  const idxWaterMm = headers.findIndex((h) => h === "water_mm" || h === "watermm");
  const idxWaterCm = headers.findIndex((h) => h === "water_cm" || h === "watercm");
  const idxPos = headers.findIndex((h) => h === "pos_sales_l" || h === "dispensed_l" || h === "dispensedl");

  let hasAtg = false;
  let hasPos = false;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const rawId = cols[idxTank] ?? "";
    const tank = tanks.find((t) => t.id.toUpperCase() === rawId.toUpperCase());
    if (!tank) continue;

    if (idxClose >= 0 && cols[idxClose] !== "") {
      const val = Number(cols[idxClose]);
      if (Number.isFinite(val) && val >= 0) {
        nextAtgL[tank.id] = val;
        nextClosingL[tank.id] = val;
        hasAtg = true;
        summary.push(`${tank.id} closing: ${val.toLocaleString()} L`);
      }
    }
    if (idxWaterMm >= 0 && cols[idxWaterMm] !== "") {
      const mm = Number(cols[idxWaterMm]);
      if (Number.isFinite(mm) && mm >= 0) {
        nextWaterMm[tank.id] = mm;
        summary.push(`${tank.id} water: ${mm} mm`);
      }
    } else if (idxWaterCm >= 0 && cols[idxWaterCm] !== "") {
      const cm = Number(cols[idxWaterCm]);
      if (Number.isFinite(cm) && cm >= 0) {
        nextWaterMm[tank.id] = Math.round(cm * 10 * 10) / 10;
        summary.push(`${tank.id} water: ${nextWaterMm[tank.id]} mm`);
      }
    }
    if (idxPos >= 0 && cols[idxPos] !== "") {
      const pos = Number(cols[idxPos]);
      if (Number.isFinite(pos) && pos >= 0) {
        nextPosSalesL[tank.id] = pos;
        hasPos = true;
        summary.push(`${tank.id} POS sales: ${pos.toLocaleString()} L`);
      }
    }
  }

  if (summary.length === 0) {
    return { ok: false, errors: ["No valid numeric tank rows parsed from CSV."] };
  }

  const detectedMode: GaugingMode = hasAtg ? "ATG" : hasPos ? "HYBRID" : shift.gaugingMode ?? "MANUAL";
  return {
    ok: true,
    detectedMode,
    patch: {
      gaugingMode: detectedMode,
      atgL: nextAtgL,
      closingL: nextClosingL,
      waterMm: nextWaterMm,
      posSalesL: nextPosSalesL,
      atgTelemetryMeta: hasAtg
        ? {
            source: "Imported CSV Telemetry",
            capturedAt: new Date().toISOString(),
            probeSchema: "CSV Standardized ATG/POS",
          }
        : shift.atgTelemetryMeta,
    },
    summary,
  };
}

export function buildSimulatedAtgPatch(
  tanks: Tank[],
  shift: Shift,
  scenario: "normal" | "alert"
): Partial<Shift> {
  // Ensure realistic meter delta exists if meters haven't moved yet
  const meters = shift.meters.map((m, idx) => {
    if (m.close > m.open) return m;
    const delta = idx === 0 ? 1850 : idx === 1 ? 1420 : idx === 2 ? 1650 : 580;
    return { ...m, close: m.open + delta };
  });

  const atgL: Record<string, number> = {};
  const closingL: Record<string, number> = { ...shift.closingL };
  const waterMm: Record<string, number> = { ...(shift.waterMm ?? {}) };

  let expectedCash = 0;

  tanks.forEach((tank, idx) => {
    const open = shift.openingL[tank.id] ?? 0;
    const delivered = shift.deliveries
      .filter((d) => d.tankId === tank.id)
      .reduce((s, d) => s + (d.postDropL - d.preDropL), 0);
    const dispensed = meters
      .filter((m) => m.tankId === tank.id && m.close >= m.open)
      .reduce((s, m) => s + (m.close - m.open), 0);
    const theoretical = open + delivered - dispensed;

    expectedCash += dispensed * (shift.prices[tank.id] ?? 170);

    if (scenario === "alert" && idx === 0) {
      // Inject a ~1.1% shortage on Tank 1 to demonstrate Trigger 1 + Trigger 5 lock
      const drop = Math.max(45, Math.round(dispensed * 0.011));
      const val = Math.max(0, Math.round((theoretical - drop) * 10) / 10);
      atgL[tank.id] = val;
      closingL[tank.id] = val;
      waterMm[tank.id] = 3;
    } else if (scenario === "alert" && idx === 1) {
      const val = Math.max(0, Math.round((theoretical - 3) * 10) / 10);
      atgL[tank.id] = val;
      closingL[tank.id] = val;
      // Inject 22 mm water ingress on Tank 2 to trigger Water Ingress Alert (> 15 mm)
      waterMm[tank.id] = 22;
    } else {
      const offset = idx === 0 ? -4 : idx === 1 ? 3 : -1;
      const val = Math.max(0, Math.round((theoretical + offset) * 10) / 10);
      atgL[tank.id] = val;
      closingL[tank.id] = val;
      waterMm[tank.id] = idx === 1 ? 4 : 0;
    }
  });

  const cashTotal = shift.cash.cash + shift.cash.mobileMoney + shift.cash.card;
  const cash =
    cashTotal > 0
      ? shift.cash
      : {
          cash: Math.round(expectedCash * 0.52),
          mobileMoney: Math.round(expectedCash * 0.41),
          card: Math.round(expectedCash * 0.07),
        };

  return {
    gaugingMode: "ATG",
    meters,
    atgL,
    closingL,
    waterMm,
    cash,
    atgTelemetryMeta: {
      source:
        scenario === "alert"
          ? "Veeder-Root TLS-450PLUS (Simulated Fault Probe)"
          : "Veeder-Root TLS-450PLUS / Gilbarco Live Probe",
      capturedAt: new Date().toISOString(),
      probeSchema: "Standardized ATG Telemetry v1",
    },
  };
}

