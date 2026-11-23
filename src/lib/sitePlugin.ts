import type { SiteTemplateContext } from "@/data/genericOhsMasterTemplate";
import { geometryLitres } from "./calc";
import { sha256Hex } from "./sha256";
import { CURRENCY_BY_COUNTRY } from "./statutory";
import type {
  Country,
  DipReading,
  NozzleMeter,
  Settings,
  Shift,
  SiteOperationalData,
  SiteProfile,
  Tank,
} from "./types";

const COUNTRY_DEFAULT_PRICES: Record<Country, number[]> = {
  Kenya: [183, 170, 150, 185, 172],
  Tanzania: [3150, 3020, 2890, 3190, 3040],
  Ghana: [14.8, 14.2, 13.5, 15.1, 14.4],
  "South Africa": [22.4, 20.9, 18.6, 22.8, 21.1],
  Uganda: [5400, 5100, 4600, 5450, 5150],
  Rwanda: [1640, 1620, 1520, 1660, 1630],
};

const PRODUCT_CATALOG = [
  { code: "PMS", label: "PMS (Unleaded Petrol 95)", capacityL: 30000, diameterCm: 200, lengthCm: 955 },
  { code: "AGO", label: "AGO (Automotive Gas Oil / Diesel)", capacityL: 30000, diameterCm: 200, lengthCm: 955 },
  { code: "IK", label: "IK (Illuminating Kerosene)", capacityL: 15000, diameterCm: 180, lengthCm: 589 },
  { code: "ULP93", label: "ULP 93 (Regular Petrol)", capacityL: 25000, diameterCm: 200, lengthCm: 796 },
  { code: "LSD", label: "LSD 10ppm (Low-Sulphur Diesel)", capacityL: 30000, diameterCm: 200, lengthCm: 955 },
];

export const DEMO_MULTI_SITE_NETWORK: SiteProfile[] = [
  {
    id: "site-ke-nbo-01",
    siteName: "Nairobi Westlands Corridor Forecourt",
    brandNetwork: "Savanna Fuels Network",
    siteCode: "KE-NBO-01",
    physicalAddress: "Corridor Arterial Way, Plot 14, Nairobi",
    country: "Kenya",
    currency: "KES",
    section162Manager: "Site Manager — Nairobi Westlands",
    emergencyContact: "999 / 112 (Kenya EMS & Fire)",
    tankCount: 3,
    dispenserCount: 6,
  },
  {
    id: "site-tz-dar-02",
    siteName: "Dar Port Gateway Service Station",
    brandNetwork: "Savanna Fuels Network",
    siteCode: "TZ-DAR-02",
    physicalAddress: "Port Access Highway, Block 08, Dar es Salaam",
    country: "Tanzania",
    currency: "TZS",
    section162Manager: "Site Manager — Dar Port Gateway",
    emergencyContact: "114 / 112 (Tanzania Fire & Rescue)",
    tankCount: 4,
    dispenserCount: 8,
  },
  {
    id: "site-gh-acc-03",
    siteName: "Accra Tema Highway Hub",
    brandNetwork: "Atlantic Gold Energy",
    siteCode: "GH-ACC-03",
    physicalAddress: "Industrial Transit Avenue, Sector 4, Accra",
    country: "Ghana",
    currency: "GHS",
    section162Manager: "Site Manager — Accra Tema Hub",
    emergencyContact: "193 / 112 (Ghana National Fire)",
    tankCount: 3,
    dispenserCount: 6,
  },
  {
    id: "site-za-jhb-04",
    siteName: "Johannesburg East Transit Centre",
    brandNetwork: "Southern Corridor Fuels",
    siteCode: "ZA-JHB-04",
    physicalAddress: "Logistics Ring Road, Stand 22, Gauteng",
    country: "South Africa",
    currency: "ZAR",
    section162Manager: "Site Manager — JHB East Transit",
    emergencyContact: "10177 / 112 (Municipal EMS & Fire)",
    tankCount: 4,
    dispenserCount: 8,
  },
  {
    id: "site-za-cpt-05",
    siteName: "Cape Peninsula Fleet Forecourt",
    brandNetwork: "Independent Retail Network",
    siteCode: "ZA-CPT-05",
    physicalAddress: "Harbour Link Boulevard, Erf 109, Western Cape",
    country: "South Africa",
    currency: "ZAR",
    section162Manager: "Site Manager — Cape Peninsula",
    emergencyContact: "107 / 112 (Regional Emergency)",
    tankCount: 2,
    dispenserCount: 4,
  },
];

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const SAMPLE_SITELIST_CSV = [
  [
    "site_name",
    "brand_network",
    "site_code",
    "physical_address",
    "country",
    "section_16_2_manager",
    "emergency_contact",
    "tank_count",
    "dispenser_count",
  ].join(","),
  ...DEMO_MULTI_SITE_NETWORK.map((site) =>
    [
      site.siteName,
      site.brandNetwork,
      site.siteCode,
      site.physicalAddress,
      site.country,
      site.section162Manager,
      site.emergencyContact,
      site.tankCount,
      site.dispenserCount,
    ]
      .map(csvEscape)
      .join(",")
  ),
].join("\n");

export const SAMPLE_SITELIST_JSON = JSON.stringify(
  {
    schema: "gear.retail.sitelist.v1",
    sites: DEMO_MULTI_SITE_NETWORK,
  },
  null,
  2
);

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  row.push(cell.trim());
  if (row.some((c) => c !== "")) rows.push(row);
  return rows;
}

export function normalizeCountryValue(raw: unknown): Country | null {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (!s) return null;
  if (s === "ke" || s.includes("kenya")) return "Kenya";
  if (s === "tz" || s.includes("tanzania")) return "Tanzania";
  if (s === "gh" || s.includes("ghana")) return "Ghana";
  if (s === "za" || s === "sa" || s.includes("south africa")) return "South Africa";
  if (s === "ug" || s.includes("uganda")) return "Uganda";
  if (s === "rw" || s.includes("rwanda")) return "Rwanda";
  return null;
}

function clampInt(raw: unknown, fallback: number, min: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function slugId(code: string, idx: number): string {
  const clean = code
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return clean ? `site-${clean}` : `site-${idx + 1}`;
}

export type SitelistParseResult =
  | { ok: true; sites: SiteProfile[]; warnings: string[] }
  | { ok: false; errors: string[] };

function mapRecordToSite(
  rec: Record<string, unknown>,
  idx: number,
  warnings: string[]
): SiteProfile | null {
  const siteName = String(
    rec.siteName ?? rec.site_name ?? rec.stationName ?? rec.station_name ?? rec.name ?? ""
  ).trim();
  if (!siteName) {
    warnings.push(`Row ${idx + 1}: skipped because site_name / stationName is blank.`);
    return null;
  }

  const rawCode = String(
    rec.siteCode ?? rec.site_code ?? rec.code ?? rec.siteId ?? rec.site_id ?? ""
  ).trim();
  const siteCode = rawCode || `SITE-${String(idx + 1).padStart(2, "0")}`;

  const rawCountry = rec.country ?? rec.regionCountry ?? rec.region_country ?? rec.region;
  const country = normalizeCountryValue(rawCountry) ?? "Kenya";
  if (rawCountry && !normalizeCountryValue(rawCountry)) {
    warnings.push(
      `Site ${siteCode}: unrecognised country "${String(rawCountry)}", defaulted to Kenya.`
    );
  }

  const brandNetwork =
    String(
      rec.brandNetwork ?? rec.brand_network ?? rec.brand ?? rec.network ?? ""
    ).trim() || "Independent Retail Forecourt";
  const physicalAddress =
    String(
      rec.physicalAddress ?? rec.physical_address ?? rec.address ?? ""
    ).trim() || `${siteName} Forecourt Precinct`;
  const section162Manager =
    String(
      rec.section162Manager ??
        rec.section_16_2_manager ??
        rec.managerName ??
        rec.manager_name ??
        rec.manager ??
        ""
    ).trim() || "16(2) Assigned Manager";
  const emergencyContact =
    String(
      rec.emergencyContact ?? rec.emergency_contact ?? rec.emergency ?? rec.phone ?? ""
    ).trim() || "112 / Regional EMS & Fire";

  const tankCount = clampInt(rec.tankCount ?? rec.tank_count ?? rec.tanks, 3, 1, 12);
  const dispenserCount = clampInt(
    rec.dispenserCount ?? rec.dispenser_count ?? rec.dispensers,
    Math.max(2, tankCount * 2),
    1,
    24
  );

  return {
    id: String(rec.id ?? "").trim() || slugId(siteCode, idx),
    siteName,
    brandNetwork,
    siteCode,
    physicalAddress,
    country,
    currency: CURRENCY_BY_COUNTRY[country],
    section162Manager,
    emergencyContact,
    tankCount,
    dispenserCount,
  };
}

export function parseSitelistInput(rawText: string): SitelistParseResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { ok: false, errors: ["Paste or upload a CSV or JSON sitelist first."] };
  }

  const warnings: string[] = [];
  const sites: SiteProfile[] = [];

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return { ok: false, errors: ["Invalid JSON syntax in sitelist feed."] };
    }

    const list = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? (parsed as { sites?: unknown; stations?: unknown }).sites ??
          (parsed as { stations?: unknown }).stations
        : null;

    if (!Array.isArray(list) || list.length === 0) {
      return {
        ok: false,
        errors: ['JSON must be an array of site objects or { "sites": [ ... ] }.'],
      };
    }

    list.forEach((item, idx) => {
      if (!item || typeof item !== "object") return;
      const mapped = mapRecordToSite(item as Record<string, unknown>, idx, warnings);
      if (mapped) sites.push(mapped);
    });
  } else {
    const cleanLines = trimmed
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith("#"))
      .join("\n");
    const rows = parseCsvRows(cleanLines);
    if (rows.length < 2) {
      return {
        ok: false,
        errors: ["CSV sitelist must include a header row and at least one station row."],
      };
    }

    const headers = rows[0].map((h) =>
      h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")
    );
    const hasNameCol = headers.some((h) =>
      ["site_name", "station_name", "name"].includes(h)
    );
    if (!hasNameCol) {
      return {
        ok: false,
        errors: ["CSV header must contain a site_name (or station_name / name) column."],
      };
    }

    for (let i = 1; i < rows.length; i++) {
      const rec: Record<string, unknown> = {};
      headers.forEach((h, colIdx) => {
        rec[h] = rows[i][colIdx] ?? "";
      });
      const mapped = mapRecordToSite(rec, i - 1, warnings);
      if (mapped) sites.push(mapped);
    }
  }

  if (sites.length === 0) {
    return {
      ok: false,
      errors: ["No valid station rows were found in the uploaded sitelist."],
    };
  }

  // Deduplicate IDs if identical site codes appear
  const seen = new Set<string>();
  const deduped = sites.map((site, idx) => {
    let id = site.id;
    if (seen.has(id)) id = `${site.id}-${idx + 1}`;
    seen.add(id);
    return { ...site, id };
  });

  return { ok: true, sites: deduped, warnings };
}

export function buildTanksAndNozzlesForSite(site: SiteProfile): {
  tanks: Tank[];
  nozzles: NozzleMeter[];
} {
  const count = clampInt(site.tankCount, 3, 1, 12);
  const dispenserCount = clampInt(site.dispenserCount, Math.max(2, count * 2), 1, 24);
  const tanks: Tank[] = [];

  for (let i = 0; i < count; i++) {
    const spec = PRODUCT_CATALOG[i % PRODUCT_CATALOG.length];
    const tierSuffix = i >= PRODUCT_CATALOG.length ? ` #${Math.floor(i / PRODUCT_CATALOG.length) + 1}` : "";
    tanks.push({
      id: `T${i + 1}`,
      name: `Tank ${i + 1}`,
      product: `${spec.label}${tierSuffix}`,
      capacityL: spec.capacityL,
      calibration: {
        mode: "geometry",
        diameterCm: spec.diameterCm,
        lengthCm: spec.lengthCm,
      },
    });
  }

  const nozzles: NozzleMeter[] = [];
  for (let i = 0; i < dispenserCount; i++) {
    const tank = tanks[i % tanks.length];
    const shortGrade = tank.product.split(" ")[0];
    const baseOpen = 45000 + i * 17500;
    nozzles.push({
      id: `N${i + 1}`,
      name: `${shortGrade}-${i + 1}`,
      tankId: tank.id,
      open: baseOpen,
      close: baseOpen + 1150,
    });
  }

  return { tanks, nozzles };
}

function estimateCmForLitres(tank: Tank, targetLitres: number): number {
  if (tank.calibration.mode !== "geometry") return 100;
  const maxD = tank.calibration.diameterCm;
  let lo = 0;
  let hi = maxD;
  for (let step = 0; step < 22; step++) {
    const mid = (lo + hi) / 2;
    const v = geometryLitres(tank.calibration.diameterCm, tank.calibration.lengthCm, mid);
    if (v < targetLitres) lo = mid;
    else hi = mid;
  }
  return Math.round(((lo + hi) / 2) * 10) / 10;
}

export function buildSiteOperationalData(site: SiteProfile): SiteOperationalData {
  const { tanks, nozzles } = buildTanksAndNozzlesForSite(site);
  const pricesList = COUNTRY_DEFAULT_PRICES[site.country] ?? COUNTRY_DEFAULT_PRICES.Kenya;
  const now = Date.now();
  const yesterdayIso = new Date(now - 24 * 3600 * 1000).toISOString();
  const openedYesterdayIso = new Date(now - 32 * 3600 * 1000).toISOString();
  const todayIso = new Date(now).toISOString();

  const seedOffset = site.siteCode
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const prevOpeningL: Record<string, number> = {};
  const prevClosingL: Record<string, number> = {};
  const prevAtgL: Record<string, number> = {};
  const waterMm: Record<string, number> = {};
  const prices: Record<string, number> = {};

  tanks.forEach((tk, idx) => {
    const startL = Math.round(tk.capacityL * (0.68 + ((seedOffset + idx * 7) % 15) / 100));
    const soldFromTank = nozzles
      .filter((n) => n.tankId === tk.id)
      .reduce((sum) => sum + 1150, 0);
    const endL = Math.max(2500, startL - soldFromTank);
    prevOpeningL[tk.id] = startL;
    prevClosingL[tk.id] = endL;
    prevAtgL[tk.id] = endL + (idx % 2 === 0 ? -3 : 2);
    waterMm[tk.id] = idx === 1 ? 2 : 0;
    prices[tk.id] = pricesList[idx % pricesList.length];
  });

  const closedMeters: NozzleMeter[] = nozzles.map((n) => ({
    ...n,
    open: n.open - 1150,
    close: n.open,
  }));

  const closedExpected = closedMeters.reduce((sum, m) => {
    const p = prices[m.tankId] ?? pricesList[0];
    return sum + Math.max(0, m.close - m.open) * p;
  }, 0);

  const closedShift: Shift = {
    id: `${site.siteCode}-S1`,
    openedAt: openedYesterdayIso,
    closedAt: yesterdayIso,
    status: "CLOSED",
    gaugingMode: "MANUAL",
    openingL: prevOpeningL,
    deliveries: [],
    meters: closedMeters,
    closingL: prevClosingL,
    atgL: prevAtgL,
    waterMm,
    prices,
    cash: {
      cash: Math.round(closedExpected * 0.52),
      mobileMoney: Math.round(closedExpected * 0.4),
      card: Math.round(closedExpected * 0.08),
    },
    investigation: null,
    signOff: {
      name: site.section162Manager,
      supervisorId: `${site.siteCode}-MGR`,
      role: "Station Manager",
      ts: yesterdayIso,
      hash: sha256Hex(`${site.siteCode}|S1|CLOSED`),
    },
  };

  const openExpected = nozzles.reduce((sum, m) => {
    const p = prices[m.tankId] ?? pricesList[0];
    return sum + Math.max(0, m.close - m.open) * p;
  }, 0);

  const openShift: Shift = {
    id: `${site.siteCode}-S2`,
    openedAt: todayIso,
    closedAt: null,
    status: "OPEN",
    gaugingMode: "MANUAL",
    openingL: { ...prevClosingL },
    deliveries: [],
    meters: nozzles,
    closingL: {},
    atgL: {},
    waterMm,
    prices,
    cash: {
      cash: Math.round(openExpected * 0.5),
      mobileMoney: Math.round(openExpected * 0.42),
      card: Math.round(openExpected * 0.08),
    },
    investigation: null,
    signOff: null,
  };

  const dips: DipReading[] = tanks.map((tk, idx) => {
    const litres = prevClosingL[tk.id];
    const cm = estimateCmForLitres(tk, litres);
    return {
      id: `D-${site.siteCode}-${idx + 1}`,
      ts: yesterdayIso,
      tankId: tk.id,
      cm,
      litres,
      waterCm: waterMm[tk.id] > 0 ? waterMm[tk.id] / 10 : 0,
      waterLitres: 0,
      kind: "CLOSING",
      dipstickType: "wooden",
      role: "Supervisor",
    };
  });

  return {
    tanks,
    nozzles,
    dips,
    shifts: [closedShift, openShift],
    tickets: [],
    completedDrills: {},
    trainingSignoffs: [],
    ohsChecklistMarks: {},
  };
}

export function syncOperationalDataToAssetCounts(
  data: SiteOperationalData,
  site: SiteProfile
): SiteOperationalData {
  const { tanks: generatedTanks, nozzles: generatedNozzles } = buildTanksAndNozzlesForSite(site);
  const pricesList = COUNTRY_DEFAULT_PRICES[site.country] ?? COUNTRY_DEFAULT_PRICES.Kenya;

  const tanks = generatedTanks.map((gen, idx) => data.tanks[idx] ?? gen);
  const nozzles = generatedNozzles.map((gen, idx) => {
    const existing = data.nozzles[idx];
    if (existing && tanks.some((t) => t.id === existing.tankId)) return existing;
    return gen;
  });

  const shifts = data.shifts.map((sh) => {
    if (sh.status === "CLOSED") return sh;
    const nextOpeningL: Record<string, number> = {};
    const nextPrices: Record<string, number> = {};
    const nextWaterMm: Record<string, number> = {};

    tanks.forEach((tk, idx) => {
      nextOpeningL[tk.id] =
        typeof sh.openingL[tk.id] === "number"
          ? sh.openingL[tk.id]
          : Math.round(tk.capacityL * 0.65);
      nextPrices[tk.id] =
        typeof sh.prices[tk.id] === "number"
          ? sh.prices[tk.id]
          : pricesList[idx % pricesList.length];
      nextWaterMm[tk.id] = sh.waterMm?.[tk.id] ?? 0;
    });

    const nextMeters: NozzleMeter[] = nozzles.map((n, idx) => {
      const existing = sh.meters[idx];
      if (existing && tanks.some((t) => t.id === existing.tankId)) return existing;
      return n;
    });

    return {
      ...sh,
      openingL: nextOpeningL,
      prices: nextPrices,
      waterMm: nextWaterMm,
      meters: nextMeters,
    };
  });

  return {
    ...data,
    tanks,
    nozzles,
    shifts,
  };
}

export function siteSettingsToTemplateContext(settings: Settings): SiteTemplateContext {
  return {
    siteName: settings.stationName || "Service Station Site",
    brandNetwork: settings.brandNetwork || "Independent Retail Forecourt",
    siteCode: settings.siteCode || "SITE-01",
    physicalAddress: settings.physicalAddress || "Site Physical Address",
    regionCountry: settings.country,
    section162Manager: settings.section162Manager || "16(2) Assigned Manager",
    emergencyContact: settings.emergencyContact || "Local Emergency Dispatch",
    tankCount: settings.tankCount || 3,
    dispenserCount: settings.dispenserCount || 4,
  };
}

