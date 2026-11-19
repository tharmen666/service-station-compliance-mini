import { sha256Hex } from "./sha256";
import type { LedgerEntry, Role } from "./types";

export const GENESIS_HASH = "0".repeat(64);

function entryHash(e: Omit<LedgerEntry, "hash">): string {
  // Fixed field order so the hash is reproducible on any device.
  return sha256Hex(
    JSON.stringify([e.seq, e.ts, e.role, e.type, e.summary, e.payload, e.prevHash])
  );
}

/** Append-only: returns a NEW array; existing entries are never mutated. */
export function appendLedger(
  ledger: LedgerEntry[],
  role: Role,
  type: string,
  summary: string,
  payload: unknown
): LedgerEntry[] {
  const seq = ledger.length + 1;
  const prevHash = ledger.length ? ledger[ledger.length - 1].hash : GENESIS_HASH;
  const base = { seq, ts: new Date().toISOString(), role, type, summary, payload, prevHash };
  const entry: LedgerEntry = { ...base, hash: entryHash(base) };
  return [...ledger, entry];
}

export function verifyLedger(ledger: LedgerEntry[]): { ok: boolean; brokenAt: number | null } {
  let prev = GENESIS_HASH;
  for (let i = 0; i < ledger.length; i++) {
    const e = ledger[i];
    if (e.seq !== i + 1 || e.prevHash !== prev) return { ok: false, brokenAt: e.seq };
    const { hash, ...rest } = e;
    if (entryHash(rest) !== hash) return { ok: false, brokenAt: e.seq };
    prev = hash;
  }
  return { ok: true, brokenAt: null };
}
