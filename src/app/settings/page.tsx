"use client";

import { RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUTORY, BENCHMARK } from "@/lib/statutory";
import { SiteSetupBulkImportPanel } from "@/components/SiteSetupBulkImportPanel";
import { Alert, Card, NumberField, PageHeader, useT } from "@/components/ui";
import { LANGS } from "@/lib/i18n";
import type { Currency, Role, TenantTheme } from "@/lib/types";

const ROLES: Role[] = ["Attendant", "Supervisor", "Station Manager"];
const CURRENCIES: Currency[] = ["KES", "TZS", "GHS", "ZAR", "UGX", "RWF"];

export default function SettingsPage() {
  const { state, mutate, reset } = useStore();
  const { t } = useT();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) =>
    mutate((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const setThreshold = (c: Currency, v: number) =>
    set({ thresholds: { ...s.thresholds, [c]: v } });
  const statutory = STATUTORY[s.country];

  return (
    <div className="space-y-4">
      <PageHeader title={t("settingsTitle")} />

      <div id="site-setup" className="scroll-mt-36">
        <SiteSetupBulkImportPanel />
      </div>

      <Card title="Operator Role &amp; Language">
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t("role")}</span>
            <select
              className="field"
              value={s.role}
              onChange={(e) => set({ role: e.target.value as Role })}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted">
            Role selection is a local workflow setting, not authentication.
          </p>
          <label className="block">
            <span className="label">{t("langLabel")}</span>
            <select
              className="field"
              value={s.lang}
              onChange={(e) => set({ lang: e.target.value as typeof s.lang })}
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label} ({l.regionGroup})
                </option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title={t("tenantTheme")}>
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t("tenantTheme")}</span>
            <select
              className="field"
              value={s.tenant}
              onChange={(e) => set({ tenant: e.target.value as TenantTheme })}
            >
              <option value="neutral">{t("themeNeutral")}</option>
              <option value="petropal">{t("themePetropal")}</option>
            </select>
          </label>
          <p className="text-sm text-muted">{t("themeNote")}</p>
        </div>
      </Card>

      <Card title={t("thresholds")}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField
              label={t("volTol")}
              value={s.volumetricTolPct}
              step="0.01"
              onChange={(v) => set({ volumetricTolPct: v })}
            />
            <NumberField
              label={t("deliveryTol")}
              value={s.deliveryTolPct}
              step="0.01"
              onChange={(v) => set({ deliveryTolPct: v })}
            />
            <NumberField
              label={t("waterAlertThreshold")}
              value={s.waterThresholdMm ?? 15}
              step="1"
              onChange={(v) => set({ waterThresholdMm: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CURRENCIES.map((c) => (
              <NumberField
                key={c}
                label={c}
                value={s.thresholds[c] ?? 0}
                step="1"
                onChange={(v) => setThreshold(c, v)}
              />
            ))}
          </div>
          <p className="text-sm text-muted">Active currency: {s.currency}</p>
        </div>
      </Card>

      <Card title={t("statutory")}>
        <dl className="mb-3 grid grid-cols-1 gap-2 text-base sm:grid-cols-2 sm:text-lg">
          <dt className="font-bold text-slate-300">Energy / fuel</dt>
          <dd className="text-ink">{statutory.energy}</dd>
          <dt className="font-bold text-slate-300">Environment</dt>
          <dd className="text-ink">{statutory.environment}</dd>
          <dt className="font-bold text-slate-300">OHS</dt>
          <dd className="text-ink">{statutory.ohs}</dd>
          <dt className="font-bold text-slate-300">Standards</dt>
          <dd className="text-ink">{statutory.standards}</dd>
        </dl>
        <Alert tone="info">
          <span className="font-bold">{t("benchmark")}:</span> {BENCHMARK}
        </Alert>
      </Card>

      <button
        type="button"
        className="btn-ghost w-full"
        onClick={() => {
          if (window.confirm(t("resetConfirm"))) reset();
        }}
      >
        <RotateCcw size={20} aria-hidden="true" />
        {t("resetData")}
      </button>
    </div>
  );
}
