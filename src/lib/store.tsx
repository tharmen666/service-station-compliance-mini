"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { appendLedger } from "./ledger";
import { buildSampleState, DEFAULT_SITE_PROFILE, SETTINGS } from "./sample";
import { buildSiteOperationalData, syncOperationalDataToAssetCounts } from "./sitePlugin";
import { CURRENCY_BY_COUNTRY } from "./statutory";
import type {
  AppState,
  Lang,
  OhsChecklistStatus,
  SiteOperationalData,
  SiteProfile,
} from "./types";

// Per-device persistence only. Ledger integrity is verified on read, so tampering is detectable.
const KEY = "service-station-compliance-mini:v1";

type Mutator = (s: AppState) => AppState;

interface StoreApi {
  state: AppState;
  loaded: boolean;
  storageOk: boolean;
  lastSavedAt: string | null;
  mutate: (fn: Mutator) => void;
  updateActiveSiteProfile: (patch: Partial<SiteProfile>) => void;
  switchSite: (siteId: string) => void;
  importSites: (newSites: SiteProfile[], mode?: "replace" | "merge") => void;
  removeSite: (siteId: string) => void;
  setOhsChecklistMark: (checklistId: string, itemId: string, status: OhsChecklistStatus) => void;
  reset: () => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

function normalizeLang(raw: unknown): Lang {
  if (raw === "en") return "en-KE";
  if (
    raw === "en-KE" ||
    raw === "sw" ||
    raw === "en-GH" ||
    raw === "en-ZA" ||
    raw === "zu" ||
    raw === "af" ||
    raw === "rw"
  ) {
    return raw;
  }
  return "en-KE";
}

function snapshotActiveSiteData(s: AppState): SiteOperationalData {
  return {
    tanks: s.tanks,
    nozzles: s.nozzles,
    dips: s.dips,
    shifts: s.shifts,
    tickets: s.tickets,
    completedDrills: s.completedDrills,
    trainingSignoffs: s.trainingSignoffs,
    ohsChecklistMarks: s.ohsChecklistMarks ?? {},
  };
}

function applyProfileToSettings(settings: AppState["settings"], profile: SiteProfile): AppState["settings"] {
  return {
    ...settings,
    stationName: profile.siteName,
    brandNetwork: profile.brandNetwork,
    siteCode: profile.siteCode,
    physicalAddress: profile.physicalAddress,
    section162Manager: profile.section162Manager,
    emergencyContact: profile.emergencyContact,
    tankCount: profile.tankCount,
    dispenserCount: profile.dispenserCount,
    country: profile.country,
    currency: profile.currency ?? CURRENCY_BY_COUNTRY[profile.country],
  };
}

function migrateState(parsed: AppState): AppState {
  const s = parsed.settings;
  const mergedSettings: AppState["settings"] = {
    ...SETTINGS,
    ...s,
    lang: normalizeLang(s?.lang),
    brandNetwork: s?.brandNetwork || SETTINGS.brandNetwork,
    siteCode: s?.siteCode || SETTINGS.siteCode,
    physicalAddress: s?.physicalAddress || SETTINGS.physicalAddress,
    section162Manager: s?.section162Manager || SETTINGS.section162Manager,
    emergencyContact: s?.emergencyContact || SETTINGS.emergencyContact,
    tankCount: typeof s?.tankCount === "number" && s.tankCount > 0 ? s.tankCount : parsed.tanks.length || SETTINGS.tankCount,
    dispenserCount:
      typeof s?.dispenserCount === "number" && s.dispenserCount > 0
        ? s.dispenserCount
        : SETTINGS.dispenserCount,
    waterThresholdMm:
      typeof s?.waterThresholdMm === "number" ? s.waterThresholdMm : SETTINGS.waterThresholdMm,
    voiceRate: typeof s?.voiceRate === "number" ? s.voiceRate : SETTINGS.voiceRate,
    thresholds: {
      ...SETTINGS.thresholds,
      ...(s?.thresholds ?? {}),
    },
  };

  const migratedShifts = parsed.shifts.map((sh) => ({
    ...sh,
    gaugingMode: sh.gaugingMode ?? "MANUAL",
    waterMm: sh.waterMm ?? {},
    posSalesL: sh.posSalesL ?? {},
    atgL: sh.atgL ?? {},
  }));

  const fallbackProfile: SiteProfile = {
    id: parsed.activeSiteId || DEFAULT_SITE_PROFILE.id,
    siteName: mergedSettings.stationName,
    brandNetwork: mergedSettings.brandNetwork,
    siteCode: mergedSettings.siteCode,
    physicalAddress: mergedSettings.physicalAddress,
    country: mergedSettings.country,
    currency: mergedSettings.currency,
    section162Manager: mergedSettings.section162Manager,
    emergencyContact: mergedSettings.emergencyContact,
    tankCount: mergedSettings.tankCount,
    dispenserCount: mergedSettings.dispenserCount,
  };

  const sites =
    Array.isArray(parsed.sites) && parsed.sites.length > 0
      ? parsed.sites.map((site) => ({
          ...fallbackProfile,
          ...site,
          currency: site.currency ?? CURRENCY_BY_COUNTRY[site.country] ?? "KES",
        }))
      : [fallbackProfile];

  const activeSiteId = sites.some((x) => x.id === parsed.activeSiteId)
    ? parsed.activeSiteId
    : sites[0].id;

  const ohsChecklistMarks = parsed.ohsChecklistMarks ?? {};

  const currentOpData: SiteOperationalData = {
    tanks: parsed.tanks,
    nozzles: Array.isArray(parsed.nozzles) ? parsed.nozzles : [],
    dips: Array.isArray(parsed.dips) ? parsed.dips : [],
    shifts: migratedShifts,
    tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
    completedDrills: parsed.completedDrills ?? {},
    trainingSignoffs: Array.isArray(parsed.trainingSignoffs) ? parsed.trainingSignoffs : [],
    ohsChecklistMarks,
  };

  const siteDataById: Record<string, SiteOperationalData> = {
    ...(parsed.siteDataById ?? {}),
    [activeSiteId]: currentOpData,
  };

  return {
    ...parsed,
    activeSiteId,
    sites,
    siteDataById,
    settings: mergedSettings,
    shifts: migratedShifts,
    ohsChecklistMarks,
  };
}

function readStorage(): AppState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.tanks) && Array.isArray(parsed.ledger)) {
      return migrateState(parsed);
    }
    return null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSampleState());
  const [loaded, setLoaded] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const stored = readStorage();
    setState(stored ?? buildSampleState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      setStorageOk(true);
      setLastSavedAt(new Date().toISOString());
    } catch {
      // Storage full or blocked: the app keeps working in memory.
      setStorageOk(false);
    }
  }, [state, loaded]);

  const mutate = useCallback((fn: Mutator) => setState((prev) => fn(prev)), []);

  const updateActiveSiteProfile = useCallback((patch: Partial<SiteProfile>) => {
    setState((prev) => {
      const currentProfile =
        prev.sites.find((x) => x.id === prev.activeSiteId) ??
        ({
          id: prev.activeSiteId || DEFAULT_SITE_PROFILE.id,
          siteName: prev.settings.stationName,
          brandNetwork: prev.settings.brandNetwork,
          siteCode: prev.settings.siteCode,
          physicalAddress: prev.settings.physicalAddress,
          country: prev.settings.country,
          currency: prev.settings.currency,
          section162Manager: prev.settings.section162Manager,
          emergencyContact: prev.settings.emergencyContact,
          tankCount: prev.settings.tankCount,
          dispenserCount: prev.settings.dispenserCount,
        } satisfies SiteProfile);

      const nextCountry = patch.country ?? currentProfile.country;
      const updatedProfile: SiteProfile = {
        ...currentProfile,
        ...patch,
        country: nextCountry,
        currency:
          patch.currency ??
          (patch.country ? CURRENCY_BY_COUNTRY[nextCountry] : currentProfile.currency),
      };

      const countsChanged =
        updatedProfile.tankCount !== currentProfile.tankCount ||
        updatedProfile.dispenserCount !== currentProfile.dispenserCount;

      const currentOp = snapshotActiveSiteData(prev);
      const nextOp = countsChanged
        ? syncOperationalDataToAssetCounts(currentOp, updatedProfile)
        : currentOp;

      const sites = prev.sites.some((x) => x.id === updatedProfile.id)
        ? prev.sites.map((x) => (x.id === updatedProfile.id ? updatedProfile : x))
        : [...prev.sites, updatedProfile];

      return {
        ...prev,
        sites,
        settings: applyProfileToSettings(prev.settings, updatedProfile),
        tanks: nextOp.tanks,
        nozzles: nextOp.nozzles,
        dips: nextOp.dips,
        shifts: nextOp.shifts,
        tickets: nextOp.tickets,
        completedDrills: nextOp.completedDrills,
        trainingSignoffs: nextOp.trainingSignoffs,
        ohsChecklistMarks: nextOp.ohsChecklistMarks,
        siteDataById: {
          ...prev.siteDataById,
          [updatedProfile.id]: nextOp,
        },
        ledger: appendLedger(
          prev.ledger,
          prev.settings.role,
          "SITE_PROFILE_UPDATED",
          `Updated site profile: ${updatedProfile.siteName} (${updatedProfile.siteCode}, ${updatedProfile.country})`,
          updatedProfile
        ),
      };
    });
  }, []);

  const switchSite = useCallback((siteId: string) => {
    setState((prev) => {
      if (siteId === prev.activeSiteId) return prev;
      const target = prev.sites.find((x) => x.id === siteId);
      if (!target) return prev;

      const savedCurrent = snapshotActiveSiteData(prev);
      const nextOp = prev.siteDataById[target.id] ?? buildSiteOperationalData(target);

      return {
        ...prev,
        activeSiteId: target.id,
        settings: applyProfileToSettings(prev.settings, target),
        tanks: nextOp.tanks,
        nozzles: nextOp.nozzles,
        dips: nextOp.dips,
        shifts: nextOp.shifts,
        tickets: nextOp.tickets,
        completedDrills: nextOp.completedDrills,
        trainingSignoffs: nextOp.trainingSignoffs,
        ohsChecklistMarks: nextOp.ohsChecklistMarks,
        siteDataById: {
          ...prev.siteDataById,
          [prev.activeSiteId]: savedCurrent,
          [target.id]: nextOp,
        },
        ledger: appendLedger(
          prev.ledger,
          prev.settings.role,
          "SITE_SWITCHED",
          `Switched active site to ${target.siteName} (${target.siteCode})`,
          { siteId: target.id, siteCode: target.siteCode, country: target.country }
        ),
      };
    });
  }, []);

  const importSites = useCallback((newSites: SiteProfile[], mode: "replace" | "merge" = "replace") => {
    if (newSites.length === 0) return;
    setState((prev) => {
      const savedCurrent = snapshotActiveSiteData(prev);
      const nextSiteDataById: Record<string, SiteOperationalData> =
        mode === "replace"
          ? {}
          : {
              ...prev.siteDataById,
              [prev.activeSiteId]: savedCurrent,
            };

      let combinedSites: SiteProfile[];
      if (mode === "replace") {
        combinedSites = newSites;
      } else {
        const byCode = new Map<string, SiteProfile>();
        prev.sites.forEach((s) => byCode.set(s.siteCode.toUpperCase(), s));
        newSites.forEach((s) => byCode.set(s.siteCode.toUpperCase(), s));
        combinedSites = Array.from(byCode.values());
      }

      combinedSites.forEach((site) => {
        if (!nextSiteDataById[site.id]) {
          nextSiteDataById[site.id] = buildSiteOperationalData(site);
        }
      });

      const activeTarget = newSites[0];
      const activeOp = nextSiteDataById[activeTarget.id];

      return {
        ...prev,
        activeSiteId: activeTarget.id,
        sites: combinedSites,
        siteDataById: nextSiteDataById,
        settings: applyProfileToSettings(prev.settings, activeTarget),
        tanks: activeOp.tanks,
        nozzles: activeOp.nozzles,
        dips: activeOp.dips,
        shifts: activeOp.shifts,
        tickets: activeOp.tickets,
        completedDrills: activeOp.completedDrills,
        trainingSignoffs: activeOp.trainingSignoffs,
        ohsChecklistMarks: activeOp.ohsChecklistMarks,
        ledger: appendLedger(
          prev.ledger,
          prev.settings.role,
          "SITELIST_IMPORTED",
          `Imported ${newSites.length} station(s) (${mode}); active: ${activeTarget.siteName} (${activeTarget.siteCode})`,
          {
            mode,
            importedCount: newSites.length,
            totalSites: combinedSites.length,
            siteCodes: newSites.map((s) => s.siteCode),
          }
        ),
      };
    });
  }, []);

  const removeSite = useCallback((siteId: string) => {
    setState((prev) => {
      if (prev.sites.length <= 1) return prev;
      const remaining = prev.sites.filter((s) => s.id !== siteId);
      if (remaining.length === prev.sites.length) return prev;

      const nextDataById = { ...prev.siteDataById };
      delete nextDataById[siteId];

      if (prev.activeSiteId !== siteId) {
        return {
          ...prev,
          sites: remaining,
          siteDataById: nextDataById,
        };
      }

      const nextActive = remaining[0];
      const nextOp = nextDataById[nextActive.id] ?? buildSiteOperationalData(nextActive);
      nextDataById[nextActive.id] = nextOp;

      return {
        ...prev,
        activeSiteId: nextActive.id,
        sites: remaining,
        siteDataById: nextDataById,
        settings: applyProfileToSettings(prev.settings, nextActive),
        tanks: nextOp.tanks,
        nozzles: nextOp.nozzles,
        dips: nextOp.dips,
        shifts: nextOp.shifts,
        tickets: nextOp.tickets,
        completedDrills: nextOp.completedDrills,
        trainingSignoffs: nextOp.trainingSignoffs,
        ohsChecklistMarks: nextOp.ohsChecklistMarks,
      };
    });
  }, []);

  const setOhsChecklistMark = useCallback(
    (checklistId: string, itemId: string, status: OhsChecklistStatus) => {
      setState((prev) => {
        const currentBucket = prev.ohsChecklistMarks?.[checklistId] ?? {};
        const nextMarks = {
          ...(prev.ohsChecklistMarks ?? {}),
          [checklistId]: {
            ...currentBucket,
            [itemId]: status,
          },
        };
        const currentOp = snapshotActiveSiteData(prev);
        return {
          ...prev,
          ohsChecklistMarks: nextMarks,
          siteDataById: {
            ...prev.siteDataById,
            [prev.activeSiteId]: {
              ...currentOp,
              ohsChecklistMarks: nextMarks,
            },
          },
        };
      });
    },
    []
  );

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setState(buildSampleState());
  }, []);

  const value = useMemo(
    () => ({
      state,
      loaded,
      storageOk,
      lastSavedAt,
      mutate,
      updateActiveSiteProfile,
      switchSite,
      importSites,
      removeSite,
      setOhsChecklistMark,
      reset,
    }),
    [
      state,
      loaded,
      storageOk,
      lastSavedAt,
      mutate,
      updateActiveSiteProfile,
      switchSite,
      importSites,
      removeSite,
      setOhsChecklistMark,
      reset,
    ]
  );
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
