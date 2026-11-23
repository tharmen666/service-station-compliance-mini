"use client";

import Link from "next/link";
import { BookOpen, Box, Building2, FileCheck2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShiftRecon, geometryCapacityL } from "@/lib/calc";
import { verifyLedger } from "@/lib/ledger";
import { DemoButton } from "@/components/DemoVideo";
import { FiveTriggerMonitorCard } from "@/components/FiveTriggerMonitorCard";
import { HybridAiDiagnosticCard } from "@/components/HybridAiDiagnosticCard";
import { VoiceBriefingBar } from "@/components/VoiceBriefingBar";
import { Alert, Card, PageHeader, fmt, useT } from "@/components/ui";

export default function DashboardPage() {
  const { state } = useStore();
  const { t } = useT();
  const { settings, tanks, shifts, dips, ledger } = state;

  const openShift = shifts.find((s) => s.status !== "CLOSED") ?? null;
  const recon = openShift
    ? computeShiftRecon(openShift, tanks, settings, shifts, dips)
    : null;
  const integrity = verifyLedger(ledger);
  const lastDip = (tankId: string) => [...dips].reverse().find((d) => d.tankId === tankId) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title={t("dashTitle")} sub={t("dashSub")} />

      {/* Active Site Profile & Wetstock Header */}
      <section className="card border-amber-500/35 bg-slate-900/95">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-400">
              <Building2 size={14} aria-hidden="true" />
              Active Station Profile · {settings.siteCode}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-black text-white sm:text-xl">
              {settings.stationName}
            </h2>
            <p className="text-xs text-slate-300 sm:text-sm">
              {settings.brandNetwork} · Mgr: {settings.section162Manager} · {tanks.length} tanks /{" "}
              {settings.dispenserCount} dispensers · {settings.country} ({settings.currency})
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link href="/ohs" className="btn-ghost min-h-[40px] px-3 py-1 text-xs font-extrabold">
              <FileCheck2 size={15} aria-hidden="true" className="text-amber-400" />
              OHS Master File
            </Link>
            <Link
              href="/settings#site-setup"
              className="btn-ghost min-h-[40px] px-3 py-1 text-xs font-extrabold"
            >
              Configure Site
            </Link>
          </div>
        </div>
      </section>

      <DemoButton />

      {openShift && recon ? (
        <VoiceBriefingBar
          shiftId={openShift.id}
          stationName={settings.stationName}
          recon={recon}
        />
      ) : null}

      <Card title={t("openLocks")}>
        {recon && recon.locked ? (
          <div className="space-y-2">
            <span className="badge-locked">LOCKED — INVESTIGATION REQUIRED</span>
            <ul className="list-disc pl-6 text-base text-red-200 sm:text-lg">
              {recon.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <Link href="/shift" className="btn mt-2 w-full">
              {t("navShift")} →
            </Link>
          </div>
        ) : (
          <Alert tone="ok">{t("noLocks")}</Alert>
        )}
      </Card>

      {openShift && recon ? (
        <FiveTriggerMonitorCard
          triggers={recon.triggers}
          volumetricTolPct={settings.volumetricTolPct}
          waterThresholdMm={settings.waterThresholdMm ?? 15}
        />
      ) : null}

      <Card title={t("tankLevels")}>
        <div className="space-y-3">
          {tanks.map((tank) => {
            const d = lastDip(tank.id);
            const pct = d && tank.capacityL > 0 ? Math.min(100, (d.litres / tank.capacityL) * 100) : 0;
            const geo = geometryCapacityL(tank);
            const capWarn = geo !== null && Math.abs(geo - tank.capacityL) / tank.capacityL > 0.01;
            const barTone =
              pct < 20 ? "bg-amber-500" : pct > 90 ? "bg-emerald-500" : "bg-primary";
            return (
              <div key={tank.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-extrabold text-ink">
                    {tank.name} · {tank.product}
                  </p>
                  <p className="font-mono text-base font-bold text-emerald-300">
                    {d ? `${fmt(d.litres, 0)} L (${pct.toFixed(0)}%)` : t("noDips")}
                  </p>
                </div>
                <div className="mt-1 h-6 w-full overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                  <div className={`h-full ${barTone}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t("capacity")}: {fmt(tank.capacityL, 0)} L
                  {d ? ` · ${t("lastDip")}: ${new Date(d.ts).toLocaleString()}` : ""}
                </p>
                {capWarn ? <p className="text-sm font-bold text-red-400">{t("capacityWarn")}</p> : null}
              </div>
            );
          })}
        </div>
      </Card>

      {openShift && recon ? (
        <HybridAiDiagnosticCard
          shiftId={openShift.id}
          stationName={settings.stationName}
          country={settings.country}
          role={settings.role}
          recon={recon}
          tanks={tanks}
        />
      ) : null}

      <Card title={t("ledgerIntegrity")}>
        {integrity.ok ? (
          <Alert tone="ok">
            {t("ledgerOk")} · {ledger.length} entries
          </Alert>
        ) : (
          <Alert tone="danger">
            {t("ledgerBroken")} #{integrity.brokenAt}
          </Alert>
        )}
      </Card>

      <Card title={t("dashGuideTitle")}>
        <p className="mb-3 text-base text-muted">{t("dashGuideBody")}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Link href="/ohs" className="btn-ghost w-full">
            <FileCheck2 size={18} aria-hidden="true" className="shrink-0 text-emerald-400" />
            Site OHS Master File
          </Link>
          <Link href="/guide" className="btn-ghost w-full">
            <BookOpen size={18} aria-hidden="true" className="shrink-0" />
            {t("dashGuideCta")}
          </Link>
          <Link href="/training-3d" className="btn-accent w-full">
            <Box size={18} aria-hidden="true" className="shrink-0" />
            {t("navTraining3d")}
          </Link>
        </div>
      </Card>

      <p className="text-sm text-muted">
        {tanks.length} tanks · {shifts.length} shifts · {settings.country} · {settings.currency}
      </p>
    </div>
  );
}
