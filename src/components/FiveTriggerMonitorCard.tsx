"use client";

import { AlertTriangle, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import type { WetstockTrigger } from "@/lib/calc";

interface Props {
  triggers: WetstockTrigger[];
  volumetricTolPct: number;
  waterThresholdMm: number;
}

export function FiveTriggerMonitorCard({
  triggers,
  volumetricTolPct,
  waterThresholdMm,
}: Props) {
  const breaches = triggers.filter((t) => t.status === "BREACH").length;
  const warnings = triggers.filter((t) => t.status === "WARN").length;

  const summaryBadge =
    breaches > 0 ? (
      <span className="badge-locked">
        {breaches} BREACH{breaches === 1 ? "" : "ES"} — LOCK ACTIVE
      </span>
    ) : warnings > 0 ? (
      <span className="badge-open">
        {warnings} EARLY WARNING{warnings === 1 ? "" : "S"}
      </span>
    ) : (
      <span className="badge-ok">ALL 5 TRIGGERS CLEAR</span>
    );

  return (
    <section className="card border-slate-700/90 bg-slate-900/95">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-50 sm:text-xl">
            5-Trigger Deterministic Wetstock &amp; Environmental Monitor
          </h2>
          <p className="text-xs text-slate-400 sm:text-sm">
            Zero-hallucination math thresholds: ±{volumetricTolPct.toFixed(2)}% variance · &gt;{waterThresholdMm} mm water ingress · rolling leak check
          </p>
        </div>
        {summaryBadge}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {triggers.map((trig) => {
          const isFull = trig.number === 5;
          const toneCls =
            trig.status === "BREACH"
              ? "border-red-500/50 bg-red-950/35"
              : trig.status === "WARN"
              ? "border-amber-500/50 bg-amber-950/30"
              : trig.status === "PASS"
              ? "border-emerald-500/40 bg-emerald-950/25"
              : "border-slate-700 bg-slate-950/60";

          const pillCls =
            trig.status === "BREACH"
              ? "bg-red-500/20 text-red-200 border-red-500/50"
              : trig.status === "WARN"
              ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
              : trig.status === "PASS"
              ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/50"
              : "bg-slate-800 text-slate-300 border-slate-600";

          const Icon =
            trig.status === "BREACH"
              ? ShieldAlert
              : trig.status === "WARN"
              ? AlertTriangle
              : trig.status === "PASS"
              ? CheckCircle2
              : Clock;

          return (
            <div
              key={trig.id}
              className={`rounded-xl border p-3 ${toneCls} ${isFull ? "sm:col-span-2" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-800 text-xs font-extrabold text-amber-400">
                    {trig.number}
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-100 sm:text-base">
                    {trig.title}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-extrabold uppercase ${pillCls}`}
                >
                  <Icon size={13} aria-hidden="true" />
                  {trig.status}
                </span>
              </div>

              <p className="mt-1.5 font-mono text-xs font-bold text-slate-200 sm:text-sm">
                {trig.metric}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">
                {trig.detail}
              </p>

              {trig.affectedTanks.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {trig.affectedTanks.map((tankName) => (
                    <span
                      key={tankName}
                      className="rounded-md border border-slate-600 bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-200"
                    >
                      {tankName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

