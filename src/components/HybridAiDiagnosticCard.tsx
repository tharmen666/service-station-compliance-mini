"use client";

import { useState } from "react";
import { Cloud, Cpu, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Card } from "@/components/ui";
import {
  generateHybridWetstockDiagnostic,
  type HybridDiagnosticResult,
} from "@/lib/hybridAiDiagnostics";
import type { ShiftRecon } from "@/lib/calc";
import type { Tank } from "@/lib/types";

interface Props {
  shiftId: string;
  stationName: string;
  country: string;
  role: string;
  recon: ShiftRecon;
  tanks: Tank[];
}

export function HybridAiDiagnosticCard({
  shiftId,
  stationName,
  country,
  role,
  recon,
  tanks,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HybridDiagnosticResult | null>(null);

  const runDiagnostic = async () => {
    setLoading(true);
    try {
      const output = await generateHybridWetstockDiagnostic({
        shiftId,
        stationName,
        country,
        role,
        recon,
        tanks,
      });
      setResult(output);
    } finally {
      setLoading(false);
    }
  };

  const badgeStyle =
    result?.path === "ON_DEVICE"
      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
      : result?.path === "CLOUD_FIREBASE_AI"
      ? "border-indigo-700 bg-indigo-50 text-indigo-900"
      : "border-amber-700 bg-amber-50 text-amber-950";

  const BadgeIcon =
    result?.path === "ON_DEVICE"
      ? Cpu
      : result?.path === "CLOUD_FIREBASE_AI"
      ? Cloud
      : ShieldCheck;

  return (
    <Card title="Hybrid AI Shift & Variance Diagnostic">
      <div className="space-y-3">
        <p className="text-sm text-muted sm:text-base">
          Runs deterministic tank strapping locally, then generates a supervisor handover brief via
          Firebase AI Logic (on-device Gemini Nano preferred, cloud Gemini 2.5 Flash &amp; offline
          fallback).
        </p>

        <button
          type="button"
          className="btn-accent w-full"
          onClick={runDiagnostic}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} aria-hidden="true" className="animate-spin" />
              Analyzing Shift Variance...
            </>
          ) : (
            <>
              <Sparkles size={18} aria-hidden="true" />
              Analyze Variance with Hybrid AI
            </>
          )}
        </button>

        {result ? (
          <div className="space-y-2 rounded-xl border-2 border-slate-300 bg-white p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide ${badgeStyle}`}
              >
                <BadgeIcon size={14} aria-hidden="true" />
                {result.badgeLabel}
              </span>
              <span className="text-xs text-muted">
                {new Date(result.generatedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="whitespace-pre-line text-sm leading-relaxed text-ink sm:text-base">
              {result.summary}
            </div>

            <p className="border-t border-slate-200 pt-2 text-xs text-muted">{result.modelNote}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

