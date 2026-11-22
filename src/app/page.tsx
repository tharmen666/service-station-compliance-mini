"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShiftRecon, geometryCapacityL } from "@/lib/calc";
import { verifyLedger } from "@/lib/ledger";
import { DemoButton } from "@/components/DemoVideo";
import { Alert, Card, PageHeader, fmt, useT } from "@/components/ui";
import { HybridAiDiagnosticCard } from "@/components/HybridAiDiagnosticCard";

export default function DashboardPage() {
  const { state } = useStore();
  const { t } = useT();
  const { settings, tanks, shifts, dips, ledger } = state;

  const openShift = shifts.find((s) => s.status !== "CLOSED") ?? null;
  const recon = openShift ? computeShiftRecon(openShift, tanks, settings) : null;
  const integrity = verifyLedger(ledger);
  const lastDip = (tankId: string) => [...dips].reverse().find((d) => d.tankId === tankId) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title={t("dashTitle")} sub={t("dashSub")} />
      <DemoButton />

      <Card title={t("openLocks")}>
        {recon && recon.locked ? (
          <div className="space-y-2">
            <span className="badge-locked">LOCKED — INVESTIGATION REQUIRED</span>
            <ul className="list-disc pl-6 text-lg">
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

      <Card title={t("tankLevels")}>
        <div className="space-y-3">
          {tanks.map((tank) => {
            const d = lastDip(tank.id);
            const pct = d && tank.capacityL > 0 ? Math.min(100, (d.litres / tank.capacityL) * 100) : 0;
            const geo = geometryCapacityL(tank);
            const capWarn = geo !== null && Math.abs(geo - tank.capacityL) / tank.capacityL > 0.01;
            return (
              <div key={tank.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-lg font-extrabold">
                    {tank.name} · {tank.product}
                  </p>
                  <p className="text-base font-bold">
                    {d ? `${fmt(d.litres, 0)} L` : t("noDips")}
                  </p>
                </div>
                <div className="mt-1 h-6 w-full overflow-hidden rounded-lg border-2 border-slate-500 bg-white">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {t("capacity")}: {fmt(tank.capacityL, 0)} L
                  {d ? ` · ${t("lastDip")}: ${new Date(d.ts).toLocaleString()}` : ""}
                </p>
                {capWarn ? <p className="text-sm font-bold text-red-800">{t("capacityWarn")}</p> : null}
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
        <Link href="/guide" className="btn-ghost w-full">
          <BookOpen size={18} aria-hidden="true" className="shrink-0" />
          {t("dashGuideCta")}
        </Link>
      </Card>

      <p className="text-sm text-muted">
        {tanks.length} tanks · {shifts.length} shifts · {settings.country} · {settings.currency}
      </p>
    </div>
  );
}
