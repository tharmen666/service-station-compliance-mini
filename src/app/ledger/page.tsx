"use client";

import { useMemo, useState } from "react";
import { Download, ShieldCheck, ShieldAlert } from "lucide-react";
import { useStore } from "@/lib/store";
import { verifyLedger } from "@/lib/ledger";
import { Alert, FOOTER_TEXT, PageHeader, useT } from "@/components/ui";
import type { DipstickType } from "@/lib/types";

function extractDipstickType(payload: unknown): DipstickType | "" {
  if (payload && typeof payload === "object" && "dipstickType" in payload) {
    const v = (payload as { dipstickType?: unknown }).dipstickType;
    if (v === "wooden" || v === "aluminium") return v;
  }
  return "";
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function LedgerPage() {
  const { state } = useStore();
  const { t } = useT();
  const [result, setResult] = useState<ReturnType<typeof verifyLedger> | null>(null);
  const reversed = useMemo(() => [...state.ledger].reverse(), [state.ledger]);

  const exportAuditCsv = () => {
    const rows = [
      ["seq", "ts", "role", "type", "dipstick_type", "summary", "hash"],
      ...state.ledger.map((e) => [
        e.seq,
        e.ts,
        e.role,
        e.type,
        extractDipstickType(e.payload),
        e.summary,
        e.hash,
      ]),
    ];
    const body = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([`${body}\n# ${FOOTER_TEXT}\n`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "service-station-audit-ledger.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("ledgerTitle")} sub={t("ledgerSub")} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          className="btn w-full"
          onClick={() => setResult(verifyLedger(state.ledger))}
        >
          <ShieldCheck size={20} aria-hidden="true" />
          {t("verify")}
        </button>
        <button type="button" className="btn-ghost w-full" onClick={exportAuditCsv}>
          <Download size={20} aria-hidden="true" />
          {t("exportAuditCsv")}
        </button>
      </div>

      {result ? (
        result.ok ? (
          <Alert tone="ok">
            {t("ledgerOk")} · {state.ledger.length} entries
          </Alert>
        ) : (
          <Alert tone="danger">
            <ShieldAlert size={20} aria-hidden="true" className="mr-1 inline" />
            {t("ledgerBroken")} #{result.brokenAt}
          </Alert>
        )
      ) : null}

      <ol className="space-y-2">
        {reversed.map((e) => {
          const dipType = extractDipstickType(e.payload);
          return (
            <li key={e.seq} className="card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-muted">
                  #{e.seq} · {new Date(e.ts).toLocaleString()} · {e.role}
                </p>
                {dipType ? (
                  <span
                    className={
                      dipType === "aluminium"
                        ? "rounded-full border border-amber-500/60 bg-amber-950/60 px-2.5 py-0.5 text-xs font-extrabold uppercase text-amber-200"
                        : "rounded-full border border-emerald-500/60 bg-emerald-950/60 px-2.5 py-0.5 text-xs font-extrabold uppercase text-emerald-200"
                    }
                  >
                    {dipType === "aluminium" ? "Dipstick: Aluminium (Legacy)" : "Dipstick: Wooden"}
                  </span>
                ) : null}
              </div>
              <p className="text-lg font-extrabold text-amber-300">{e.type}</p>
              <p className="text-base text-slate-100">{e.summary}</p>
              <p className="mt-1 break-all font-mono text-xs text-muted">sha256: {e.hash}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
