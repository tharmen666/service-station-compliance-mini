// Payload validators shared by the /api/v1/connectors/* routes and the Connectors UI.
// Deterministic checks only: type, range and required-field validation.

export type Validated<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 64): string | null =>
  typeof v === "string" && v.trim() !== "" && v.length <= max ? v.trim() : null;
const num = (v: unknown, min = 0): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= min ? v : null;
const isoDate = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
const isoTs = (v: unknown): string | null =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null;

// ---- Titan Cloud: ATG daily closing volumes (L) and water levels ----
export interface TitanPayload {
  stationId: string;
  date: string;
  readings: { tankId: string; closingL: number; waterCm: number | null }[];
}
export function validateTitan(body: unknown): Validated<TitanPayload> {
  const errors: string[] = [];
  if (!isObj(body)) return { ok: false, errors: ["Body must be a JSON object"] };
  const stationId = str(body.stationId);
  const date = isoDate(body.date);
  if (!stationId) errors.push("stationId is required");
  if (!date) errors.push("date must be YYYY-MM-DD");
  if (!Array.isArray(body.readings) || body.readings.length === 0) errors.push("readings must be a non-empty array");
  const readings: TitanPayload["readings"] = [];
  (Array.isArray(body.readings) ? body.readings : []).forEach((r, i) => {
    if (!isObj(r)) return errors.push(`readings[${i}] must be an object`);
    const tankId = str(r.tankId, 16);
    const closingL = num(r.closingL);
    const waterCm = r.waterCm === undefined || r.waterCm === null ? null : num(r.waterCm);
    if (!tankId) errors.push(`readings[${i}].tankId is required`);
    if (closingL === null) errors.push(`readings[${i}].closingL must be a number >= 0 (litres)`);
    if (r.waterCm !== undefined && r.waterCm !== null && waterCm === null) errors.push(`readings[${i}].waterCm must be >= 0`);
    if (tankId && closingL !== null) readings.push({ tankId, closingL, waterCm });
  });
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { stationId: stationId!, date: date!, readings } };
}

// ---- Omnicomm: tanker dispatch volume (L) and GPS arrival timestamp ----
export interface OmnicommPayload {
  stationId: string;
  waybillNo: string;
  tankId: string | null;
  dispatchL: number;
  gpsArrivalIso: string;
}
export function validateOmnicomm(body: unknown): Validated<OmnicommPayload> {
  const errors: string[] = [];
  if (!isObj(body)) return { ok: false, errors: ["Body must be a JSON object"] };
  const stationId = str(body.stationId);
  const waybillNo = str(body.waybillNo, 32);
  const dispatchL = num(body.dispatchL, 1);
  const gpsArrivalIso = isoTs(body.gpsArrivalIso);
  if (!stationId) errors.push("stationId is required");
  if (!waybillNo) errors.push("waybillNo is required");
  if (dispatchL === null) errors.push("dispatchL must be a number > 0 (litres)");
  if (!gpsArrivalIso) errors.push("gpsArrivalIso must be an ISO-8601 timestamp");
  if (body.tankId !== undefined && body.tankId !== null && !str(body.tankId, 16)) errors.push("tankId must be a string");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      stationId: stationId!,
      waybillNo: waybillNo!,
      tankId: str(body.tankId, 16),
      dispatchL: dispatchL!,
      gpsArrivalIso: gpsArrivalIso!,
    },
  };
}

// ---- OMIS 4.0: outbound maintenance / calibration ticket ----
export interface OmisTicket {
  stationId: string;
  ticketType: "PUMP_METER_DRIFT" | "UST_WATER_INGRESS" | "WETSTOCK_VARIANCE";
  severity: "HIGH" | "CRITICAL";
  asset: string;
  detail: string;
  raisedAt: string;
  source: "service-station-compliance-mini";
}
export function validateOmis(body: unknown): Validated<OmisTicket> {
  const errors: string[] = [];
  if (!isObj(body)) return { ok: false, errors: ["Body must be a JSON object"] };
  const stationId = str(body.stationId);
  const asset = str(body.asset, 64);
  const detail = str(body.detail, 500);
  const raisedAt = isoTs(body.raisedAt);
  const ticketType = body.ticketType;
  const severity = body.severity;
  if (!stationId) errors.push("stationId is required");
  if (!asset) errors.push("asset is required");
  if (!detail) errors.push("detail is required");
  if (!raisedAt) errors.push("raisedAt must be an ISO-8601 timestamp");
  if (ticketType !== "PUMP_METER_DRIFT" && ticketType !== "UST_WATER_INGRESS" && ticketType !== "WETSTOCK_VARIANCE")
    errors.push("ticketType must be PUMP_METER_DRIFT, UST_WATER_INGRESS or WETSTOCK_VARIANCE");
  if (severity !== "HIGH" && severity !== "CRITICAL") errors.push("severity must be HIGH or CRITICAL");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      stationId: stationId!,
      ticketType: ticketType as OmisTicket["ticketType"],
      severity: severity as OmisTicket["severity"],
      asset: asset!,
      detail: detail!,
      raisedAt: raisedAt!,
      source: "service-station-compliance-mini",
    },
  };
}
