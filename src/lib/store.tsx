"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSampleState } from "./sample";
import type { AppState } from "./types";

// Per-device persistence only. Ledger integrity is verified on read, so tampering is detectable.
const KEY = "service-station-compliance-mini:v1";

type Mutator = (s: AppState) => AppState;

interface StoreApi {
  state: AppState;
  loaded: boolean;
  mutate: (fn: Mutator) => void;
  reset: () => void;
}

const StoreCtx = createContext<StoreApi | null>(null);

function readStorage(): AppState | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppState;
    if (parsed && parsed.version === 1 && Array.isArray(parsed.tanks) && Array.isArray(parsed.ledger)) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => buildSampleState());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = readStorage();
    setState(stored ?? buildSampleState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the app keeps working in memory.
    }
  }, [state, loaded]);

  const mutate = useCallback((fn: Mutator) => setState((prev) => fn(prev)), []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setState(buildSampleState());
  }, []);

  const value = useMemo(() => ({ state, loaded, mutate, reset }), [state, loaded, mutate, reset]);
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
