"use client";

import { RotateCcw } from "lucide-react";
import { useStore } from "@/lib/store";
import { STATUTORY, BENCHMARK, CURRENCY_BY_COUNTRY } from "@/lib/statutory";
import { Alert, Card, NumberField, PageHeader, useT } from "@/components/ui";
import { LANGS } from "@/lib/i18n";
import type { Country, Currency, Role, TenantTheme } from "@/lib/types";

const COUNTRIES = Object.keys(STATUTORY) as Country[];
const ROLES: Role[] = ["Attendant", "Supervisor", "Station Manager"];
const CURRENCIES: Currency[] = ["KES", "TZS", "UGX", "RWF"];

export default function SettingsPage() {
  const { state, mutate, reset } = useStore();
  const { t } = useT();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => mutate((x) => ({ ...x, settings: { ...x.settings, ...patch } }));
  const setThreshold = (c: Currency, v: number) =>
    set({ thresholds: { ...s.thresholds, [c]: v } });
  const statutory = STATUTORY[s.country];

  return (
    <div className="space-y-4">
      <PageHeader title={t("settingsTitle")} />

      <Card>
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t("stationName")}</span>
            <input className="field" value={s.stationName} onChange={(e) => set({ stationName: e.target.value })} />
          </label>
          <label className="block">
            <span className="label">{t("country")}</span>
            <select
              className="field"
              value={s.country}
              onChange={(e) => {
                const country = e.target.value as Country;
                set({ country, currency: CURRENCY_BY_COUNTRY[country] });
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">{t("role")}</span>
            <select className="field" value={s.role} onChange={(e) => set({ role: e.target.value as Role })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted">Role selection is a local workflow setting, not authentication.</p>
          <label className="block">
            <span className="label">Language</span>
            <select className="field" value={s.lang} onChange={(e) => set({ lang: e.target.value as typeof s.lang })}>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <Card title={t("tenantTheme")}>
        <div className="space-y-3">
          <label className="block">
            <span className="label">{t("tenantTheme")}</span>
            <select className="field" value={s.tenant} onChange={(e) => set({ tenant: e.target.value as TenantTheme })}>
              <option value="neutral">{t("themeNeutral")}</option>
              <option value="petropal">{t("themePetropal")}</option>
            </select>
          </label>
          <p className="text-sm text-muted">{t("themeNote")}</p>
        </div>
      </Card>

      <Card title={t("thresholds")}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberField label={t("volTol")} value={s.volumetricTolPct} step="0.01" onChange={(v) => set({ volumetricTolPct: v })} />
            <NumberField label={t("deliveryTol")} value={s.deliveryTolPct} step="0.01" onChange={(v) => set({ deliveryTolPct: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CURRENCIES.map((c) => (
              <NumberField key={c} label={c} value={s.thresholds[c]} step="1" onChange={(v) => setThreshold(c, v)} />
            ))}
          </div>
          <p className="text-sm text-muted">Active currency: {s.currency}</p>
        </div>
      </Card>

      <Card title={t("statutory")}>
        <dl className="grid grid-cols-1 gap-2 text-lg sm:grid-cols-2">
          <dt className="font-bold">Energy / fuel</dt>
          <dd>{statutory.energy}</dd>
          <dt className="font-bold">Environment</dt>
          <dd>{statutory.environment}</dd>
          <dt className="font-bold">OHS</dt>
          <dd>{statutory.ohs}</dd>
          <dt className="font-bold">Standards</dt>
          <dd>{statutory.standards}</dd>
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
