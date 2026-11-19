import type { Country } from "./types";

// Static statutory lookup. Mapping is deterministic; verify current gazettement with counsel before reliance.
export interface StatutoryMap {
  energy: string;
  environment: string;
  ohs: string;
  standards: string;
}

export const STATUTORY: Record<Country, StatutoryMap> = {
  Kenya: { energy: "EPRA", environment: "NEMA", ohs: "DOSHS / OSHA 2007", standards: "KEBS" },
  Tanzania: { energy: "EWURA", environment: "NEMC", ohs: "OSHA Tanzania", standards: "TBS" },
  Uganda: { energy: "MEMD (Petroleum Supply Dept.) & UNBS", environment: "NEMA Uganda", ohs: "OSH Act 2006", standards: "UNBS" },
  Rwanda: { energy: "RURA", environment: "REMA", ohs: "Rwandan Labour / OSH Law", standards: "RSB" },
};

export const BENCHMARK = "OHSA 85 of 1993 & SANS 10089-3 (UST integrity & forecourt safety benchmark)";

export const CURRENCY_BY_COUNTRY = {
  Kenya: "KES",
  Tanzania: "TZS",
  Uganda: "UGX",
  Rwanda: "RWF",
} as const;

/** Which statutory bodies a workflow maps to, by key. */
export function authoritiesFor(
  workflow: "wetstock" | "spill" | "evacuation" | "ohs" | "tanker" | "customer" | "firstaid",
  country: Country
): string[] {
  const m = STATUTORY[country];
  switch (workflow) {
    case "wetstock":
    case "tanker":
      return [m.energy, m.standards];
    case "spill":
    case "evacuation":
      return [m.environment, m.ohs];
    case "ohs":
    case "firstaid":
      return [m.ohs];
    case "customer":
      return [m.energy];
  }
}
