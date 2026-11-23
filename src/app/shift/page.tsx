"use client";

import { useState } from "react";
import {
  Activity,
  Cable,
  CheckCircle2,
  Cpu,
  Droplets,
  FileUp,
  Lock,
  Plus,
  Ruler,
  ShieldAlert,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShiftRecon, litresFromCm } from "@/lib/calc";
import { appendLedger } from "@/lib/ledger";
import { sha256Hex } from "@/lib/sha256";
import {
  buildSimulatedAtgPatch,
  parseInboundPayload,
  SAMPLE_POS_JSON,
} from "@/lib/integrationPayloads";
import { FiveTriggerMonitorCard } from "@/components/FiveTriggerMonitorCard";
import { HybridAiDiagnosticCard } from "@/components/HybridAiDiagnosticCard";
import { IntegrationHubPanel } from "@/components/IntegrationHubPanel";
import { VoiceBriefingBar } from "@/components/VoiceBriefingBar";
import { Alert, Card, DipstickField, NumberField, PageHeader, fmt, useT } from "@/components/ui";
import type {
  Delivery,
  DipstickType,
  GaugingMode,
  InvestigationCause,
  Role,
  Shift,
  Tank,
} from "@/lib/types";

const CAUSES: InvestigationCause[] = [
  "CALIBRATION_DRIFT",
  "SUSPECTED_UNDERGROUND_LEAK",
  "DELIVERY_SHORT_DROP",
  "METER_ERROR",
  "THEFT_UNACCOUNTED",
  "OTHER",
];
const SIGN_ROLES: Role[] = ["Supervisor", "Station Manager"];

const GAUGING_MODES: {
  id: GaugingMode;
  labelKey: "modeManual" | "modeHybrid" | "modeAtg";
  desc: string;
}[] = [
  {
    id: "MANUAL",
    labelKey: "modeManual",
    desc: "Physical dipstick cm-to-Litres strapping + manual pump totalizer entry.",
  },
  {
    id: "HYBRID",
    labelKey: "modeHybrid",
    desc: "Manual tank dip paired with one-click POS sales CSV/JSON paste or import.",
  },
  {
    id: "ATG",
    labelKey: "modeAtg",
    desc: "Standardized ATG telemetry (Veeder-Root / Gilbarco / generic probe JSON or CSV).",
  },
];

export default function ShiftPage() {
  const { state, mutate } = useStore();
  const { t } = useT();
  const { tanks, shifts, settings, nozzles, dips } = state;
  const role = settings.role;

  const [hubOpen, setHubOpen] = useState(false);

  const current = shifts.find((s) => s.status !== "CLOSED") ?? null;
  const lastClosed = [...shifts].reverse().find((s) => s.status === "CLOSED") ?? null;

  const openNewShift = () => {
    const last = lastClosed;
    const openingL: Record<string, number> = {};
    tanks.forEach((tk) => (openingL[tk.id] = last?.closingL[tk.id] ?? 0));
    const meters = last
      ? last.meters.map((m) => ({ ...m, open: m.close, close: m.close }))
      : nozzles.map((n) => ({ ...n, open: n.open, close: n.open }));
    const shift: Shift = {
      id: `S-${Date.now().toString(36).toUpperCase()}`,
      openedAt: new Date().toISOString(),
      closedAt: null,
      status: "OPEN",
      gaugingMode: last?.gaugingMode ?? "MANUAL",
      openingL,
      deliveries: [],
      meters,
      closingL: {},
      atgL: {},
      waterMm: {},
      posSalesL: {},
      prices: last?.prices ?? {},
      cash: { cash: 0, mobileMoney: 0, card: 0 },
      investigation: null,
      signOff: null,
    };
    mutate((s) => ({
      ...s,
      shifts: [...s.shifts, shift],
      ledger: appendLedger(s.ledger, role, "SHIFT_OPENED", `Shift ${shift.id} opened`, {
        shiftId: shift.id,
        openingL,
      }),
    }));
  };

  const patch = (fn: (sh: Shift) => Shift) => {
    if (!current) return;
    mutate((s) => ({ ...s, shifts: s.shifts.map((x) => (x.id === current.id ? fn(x) : x)) }));
  };

  if (!current) {
    return (
      <div className="space-y-4">
        <PageHeader
          title={t("shiftTitle")}
          sub={`${settings.siteCode} · ${settings.stationName} · ${settings.brandNetwork} · Mgr: ${settings.section162Manager}`}
        />

        {lastClosed?.signOff ? (
          <Alert tone="ok">
            <p className="font-extrabold">
              Latest Closed Shift: {lastClosed.id} — Signed by {lastClosed.signOff.name}
              {lastClosed.signOff.supervisorId ? ` (${lastClosed.signOff.supervisorId})` : ""}
            </p>
            {lastClosed.signOff.hash ? (
              <p className="mt-1 break-all font-mono text-xs text-emerald-200">
                SHA-256 Sign-off Seal: {lastClosed.signOff.hash}
              </p>
            ) : null}
          </Alert>
        ) : null}

        <button type="button" className="btn w-full" onClick={openNewShift}>
          <Plus size={20} aria-hidden="true" />
          {t("newShift")}
        </button>

        <IntegrationHubPanel compact />
      </div>
    );
  }

  const gaugingMode: GaugingMode = current.gaugingMode ?? "MANUAL";
  const recon = computeShiftRecon(current, tanks, settings, shifts, dips);
  const gateBreached = recon.triggers[4]?.blocksClose ?? false;
  const canSign = recon.allClosingEntered && !gateBreached;
  const statusLabel = gateBreached ? t("statusLocked") : t("statusOpen");

  const setMode = (mode: GaugingMode) => {
    patch((sh) => ({ ...sh, gaugingMode: mode }));
  };

  const simulateAtg = (scenario: "normal" | "alert") => {
    const simPatch = buildSimulatedAtgPatch(tanks, current, scenario);
    mutate((s) => ({
      ...s,
      shifts: s.shifts.map((x) => (x.id === current.id ? { ...x, ...simPatch } : x)),
      ledger: appendLedger(
        s.ledger,
        role,
        "ATG_TELEMETRY_SIMULATED",
        `Simulated ${scenario.toUpperCase()} ATG telemetry applied to ${current.id}`,
        { shiftId: current.id, scenario, atgL: simPatch.atgL, waterMm: simPatch.waterMm }
      ),
    }));
  };

  const closeShift = (name: string, supervisorId: string, signRole: Role) => {
    const ts = new Date().toISOString();
    const signOffHash = sha256Hex(
      JSON.stringify({
        shiftId: current.id,
        stationName: settings.stationName,
        country: settings.country,
        gaugingMode,
        closedAt: ts,
        supervisorName: name,
        supervisorId,
        role: signRole,
        investigation: current.investigation,
        tanks: recon.tanks.map((r) => ({
          tankId: r.tankId,
          theoreticalL: r.theoreticalL,
          closingL: r.closingL,
          varianceL: r.varianceL,
          waterMm: r.waterMm,
        })),
        triggers: recon.triggers.map((tr) => ({ id: tr.id, status: tr.status })),
      })
    );

    const closingLForNext =
      gaugingMode === "ATG"
        ? { ...current.closingL, ...current.atgL }
        : current.closingL;

    mutate((s) => ({
      ...s,
      shifts: s.shifts.map((x) =>
        x.id === current.id
          ? {
              ...x,
              status: "CLOSED",
              closedAt: ts,
              closingL: closingLForNext,
              signOff: { name, supervisorId, role: signRole, ts, hash: signOffHash },
            }
          : x
      ),
      ledger: appendLedger(
        s.ledger,
        signRole,
        "SHIFT_CLOSED",
        `Shift ${current.id} closed & sealed by ${name} (${supervisorId})`,
        {
          shiftId: current.id,
          supervisorId,
          signOffHash,
          recon,
          investigation: current.investigation,
        }
      ),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("shiftTitle")}
        sub={`${settings.siteCode} · ${settings.stationName} (${settings.brandNetwork}) · ${current.id} · ${new Date(current.openedAt).toLocaleString()}`}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={gateBreached ? "badge-locked" : "badge-open"}>{statusLabel}</span>
          <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-300">
            {t("role")}: {role}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setHubOpen((v) => !v)}
          className="btn-ghost min-h-[44px] px-3 py-1.5 text-sm"
        >
          <Cable size={16} aria-hidden="true" className="text-amber-400" />
          {hubOpen ? "Hide IT & ERP Connectors" : "IT & ERP Connectors"}
        </button>
      </div>

      {/* Collapsible Integration Hub Drawer */}
      {hubOpen ? <IntegrationHubPanel compact /> : null}

      {/* Adaptive Gauging Mode Switcher */}
      <section className="card border-slate-700 bg-slate-900/95">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-extrabold uppercase tracking-wide text-amber-400">
            {t("gaugingModeLabel")} (Normalized Deterministic Pipeline)
          </span>
          <span className="font-mono text-xs text-slate-400">Active: {gaugingMode}</span>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="group" aria-label={t("gaugingModeLabel")}>
          {GAUGING_MODES.map((m) => {
            const active = gaugingMode === m.id;
            const Icon = m.id === "MANUAL" ? Ruler : m.id === "HYBRID" ? Activity : Cpu;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={active}
                onClick={() => setMode(m.id)}
                className={`flex min-h-[54px] flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? "border-amber-400 bg-amber-500 text-slate-950"
                    : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-500"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-extrabold">
                  <Icon size={16} aria-hidden="true" />
                  {t(m.labelKey)}
                </span>
                <span className={`mt-0.5 text-xs ${active ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
                  {m.id === "MANUAL"
                    ? "Dipstick cm → L"
                    : m.id === "HYBRID"
                    ? "Manual dip + POS CSV/JSON"
                    : "Veeder-Root / Gilbarco probe"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-slate-300">
          {GAUGING_MODES.find((x) => x.id === gaugingMode)?.desc}
        </p>

        {gaugingMode === "ATG" ? (
          <div className="mt-3 rounded-xl border border-slate-700 bg-slate-950/80 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-emerald-300">
                  Electronic ATG Telemetry Controls
                </p>
                <p className="text-xs text-slate-400">
                  {current.atgTelemetryMeta
                    ? `${current.atgTelemetryMeta.source} · ${new Date(current.atgTelemetryMeta.capturedAt).toLocaleTimeString()}`
                    : "Awaiting live ATG probe JSON/CSV or demo simulation."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-accent min-h-[44px] px-3 text-xs sm:text-sm"
                  onClick={() => simulateAtg("normal")}
                >
                  <Cpu size={16} aria-hidden="true" />
                  Simulate Live ATG Telemetry
                </button>
                <button
                  type="button"
                  className="btn-ghost min-h-[44px] border-red-500/60 px-3 text-xs text-red-200 hover:border-red-400 sm:text-sm"
                  onClick={() => simulateAtg("alert")}
                >
                  <ShieldAlert size={16} aria-hidden="true" className="text-red-400" />
                  Simulate Variance &amp; Water Alert
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <VoiceBriefingBar
        shiftId={current.id}
        stationName={settings.stationName}
        recon={recon}
      />

      {/* 5 Deterministic Triggers Monitor */}
      <FiveTriggerMonitorCard
        triggers={recon.triggers}
        volumetricTolPct={settings.volumetricTolPct}
        waterThresholdMm={settings.waterThresholdMm ?? 15}
      />

      {gateBreached ? (
        <Alert tone="danger">
          <strong>{t("statusLocked")}</strong>
          <br />
          {t("lockBanner")}
          <ul className="mt-2 list-disc pl-6 text-sm sm:text-base">
            {recon.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      <Card title={t("stepOpen")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tanks.map((tk) => (
            <NumberField
              key={tk.id}
              label={`${tk.name} — ${t("openingL")}`}
              value={current.openingL[tk.id] ?? 0}
              step="1"
              onChange={(v) => patch((sh) => ({ ...sh, openingL: { ...sh.openingL, [tk.id]: v } }))}
            />
          ))}
        </div>
      </Card>

      <DeliveriesCard current={current} tanks={tanks} deliveryTolPct={settings.deliveryTolPct} patch={patch} />

      <Card title={t("stepMeters")}>
        {gaugingMode === "HYBRID" ? (
          <HybridPosImportBox current={current} tanks={tanks} patch={patch} />
        ) : null}

        <div className="space-y-3">
          {current.meters.map((m) => (
            <div
              key={m.id}
              className="space-y-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3 sm:grid sm:grid-cols-3 sm:items-end sm:gap-2 sm:space-y-0"
            >
              <div>
                <p className="text-base font-extrabold text-ink sm:text-lg">{m.name}</p>
                <p className="text-xs text-muted">
                  Dispensed: {fmt(Math.max(0, m.close - m.open), 0)} L
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 min-[340px]:grid-cols-2 sm:contents">
                <NumberField
                  label={t("meterOpen")}
                  value={m.open}
                  step="1"
                  onChange={(v) =>
                    patch((sh) => ({
                      ...sh,
                      meters: sh.meters.map((x) => (x.id === m.id ? { ...x, open: v } : x)),
                    }))
                  }
                />
                <NumberField
                  label={t("meterClose")}
                  value={m.close}
                  step="1"
                  onChange={(v) =>
                    patch((sh) => ({
                      ...sh,
                      meters: sh.meters.map((x) => (x.id === m.id ? { ...x, close: v } : x)),
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("stepClose")}>
        <div className="space-y-4">
          {tanks.map((tk) =>
            gaugingMode === "ATG" ? (
              <AtgClosingRow key={tk.id} tank={tk} shift={current} waterThresholdMm={settings.waterThresholdMm ?? 15} patch={patch} />
            ) : (
              <ClosingDipRow
                key={tk.id}
                tankId={tk.id}
                tankName={tk.name}
                shift={current}
                waterThresholdMm={settings.waterThresholdMm ?? 15}
                onWaterChange={(mm) =>
                  patch((sh) => ({
                    ...sh,
                    waterMm: { ...(sh.waterMm ?? {}), [tk.id]: mm },
                  }))
                }
                onLock={(_cm, L, atg, waterMm) =>
                  patch((sh) => ({
                    ...sh,
                    closingL: { ...sh.closingL, [tk.id]: L },
                    atgL: atg === null ? sh.atgL : { ...sh.atgL, [tk.id]: atg },
                    waterMm: { ...(sh.waterMm ?? {}), [tk.id]: waterMm },
                  }))
                }
                tank={tk}
              />
            )
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tanks.map((tk) => (
              <NumberField
                key={tk.id}
                label={`${tk.name} — ${t("price")}`}
                value={current.prices[tk.id] ?? 0}
                step="0.01"
                onChange={(v) =>
                  patch((sh) => ({ ...sh, prices: { ...sh.prices, [tk.id]: v } }))
                }
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField
              label={`${t("cash")} (${settings.currency})`}
              value={current.cash.cash}
              step="1"
              onChange={(v) =>
                patch((sh) => ({ ...sh, cash: { ...sh.cash, cash: v } }))
              }
            />
            <NumberField
              label={`${t("mobileMoney")} (${settings.currency})`}
              value={current.cash.mobileMoney}
              step="1"
              onChange={(v) =>
                patch((sh) => ({ ...sh, cash: { ...sh.cash, mobileMoney: v } }))
              }
            />
            <NumberField
              label={`${t("card")} (${settings.currency})`}
              value={current.cash.card}
              step="1"
              onChange={(v) =>
                patch((sh) => ({ ...sh, cash: { ...sh.cash, card: v } }))
              }
            />
          </div>
        </div>
      </Card>

      <Card title="Reconciliation Summary">
        {/* Stacked mobile cards for 375px viewports */}
        <div className="space-y-2 sm:hidden">
          {recon.tanks.map((r) => (
            <div
              key={r.tankId}
              className={`rounded-xl border p-3 ${
                r.locked
                  ? "border-red-500/60 bg-red-950/40"
                  : "border-slate-700 bg-slate-950/60"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-extrabold text-ink">{r.product.split(" ")[0]}</p>
                <span className="font-mono text-xs text-slate-400">{r.closingSource}</span>
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">{t("theoretical")}</dt>
                <dd className="text-right font-semibold">{fmt(r.theoreticalL)} L</dd>
                <dt className="text-muted">{t("closingL")}</dt>
                <dd className="text-right font-semibold">
                  {r.closingL === null ? "—" : `${fmt(r.closingL)} L`}
                </dd>
                <dt className="text-muted">{t("variance")}</dt>
                <dd
                  className={`text-right font-extrabold ${
                    r.locked ? "text-red-300" : "text-emerald-300"
                  }`}
                >
                  {r.varianceL === null
                    ? "—"
                    : `${fmt(r.varianceL)} L (${r.variancePct?.toFixed(2)}%)`}
                </dd>
                <dt className="text-muted">Water (mm)</dt>
                <dd className="text-right font-semibold">
                  {r.waterMm === null ? "—" : `${r.waterMm.toFixed(1)} mm`}
                </dd>
              </dl>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[600px] text-left text-base">
            <thead>
              <tr className="border-b border-slate-700 text-slate-300">
                <th className="py-2">Tank</th>
                <th>{t("theoretical")}</th>
                <th>{t("closingL")}</th>
                <th>{t("variance")}</th>
                <th>{t("tolerance")}</th>
                <th>Water</th>
              </tr>
            </thead>
            <tbody>
              {recon.tanks.map((r) => (
                <tr
                  key={r.tankId}
                  className={`border-b border-slate-800 ${
                    r.locked ? "bg-red-950/35 text-red-100" : ""
                  }`}
                >
                  <td className="py-2 font-bold">
                    {r.product.split(" ")[0]}{" "}
                    <span className="font-mono text-xs text-slate-400">[{r.closingSource}]</span>
                  </td>
                  <td>{fmt(r.theoreticalL)} L</td>
                  <td>{r.closingL === null ? "—" : `${fmt(r.closingL)} L`}</td>
                  <td className={`font-bold ${r.locked ? "text-red-300" : "text-emerald-300"}`}>
                    {r.varianceL === null
                      ? "—"
                      : `${r.varianceL >= 0 ? "+" : ""}${fmt(r.varianceL)} L (${r.variancePct?.toFixed(2)}%)`}
                  </td>
                  <td>
                    ±{fmt(r.tolL)} L (±{r.tolPct.toFixed(2)}%)
                  </td>
                  <td>{r.waterMm === null ? "—" : `${r.waterMm.toFixed(1)} mm`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-base sm:grid-cols-3 sm:text-lg">
          <p>
            <span className="font-bold text-slate-300">{t("expectedRevenue")}:</span>{" "}
            <span className="font-mono font-bold text-ink">
              {settings.currency} {fmt(recon.expectedRevenue, 0)}
            </span>
          </p>
          <p>
            <span className="font-bold text-slate-300">{t("collected")}:</span>{" "}
            <span className="font-mono font-bold text-emerald-300">
              {settings.currency} {fmt(recon.collected, 0)}
            </span>
          </p>
          <p>
            <span className="font-bold text-slate-300">{t("shortfall")}:</span>{" "}
            <span
              className={`font-mono font-bold ${
                Math.abs(recon.shortfall) > recon.cashThreshold
                  ? "text-red-300"
                  : "text-slate-100"
              }`}
            >
              {settings.currency} {fmt(recon.shortfall, 0)}
            </span>
          </p>
        </div>
      </Card>

      <HybridAiDiagnosticCard
        shiftId={current.id}
        stationName={settings.stationName}
        country={settings.country}
        role={role}
        recon={recon}
        tanks={tanks}
      />

      {recon.locked ? <InvestigationCard current={current} patch={patch} role={role} /> : null}

      <Card title={t("signOffTitle")}>
        <SignOffForm
          enabled={canSign}
          role={role}
          reason={
            !recon.allClosingEntered
              ? t("cannotClose")
              : gateBreached
              ? t("lockBanner")
              : ""
          }
          onSign={closeShift}
          label={t("closeShift")}
          nameLabel={t("signOffName")}
          idLabel={t("signOffId")}
          signLabel={t("signOff")}
          roleGateText={t("roleGate")}
        />
      </Card>
    </div>
  );
}

function HybridPosImportBox({
  current,
  tanks,
  patch,
}: {
  current: Shift;
  tanks: Tank[];
  patch: (fn: (sh: Shift) => Shift) => void;
}) {
  const { mutate, state } = useStore();
  const [raw, setRaw] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const applyPos = (text: string) => {
    const res = parseInboundPayload(text, tanks, current);
    if (!res.ok) {
      setMsg({ ok: false, text: res.errors.join(" · ") });
      return;
    }
    mutate((s) => ({
      ...s,
      shifts: s.shifts.map((x) =>
        x.id === current.id
          ? {
              ...x,
              posSalesL: res.patch.posSalesL ?? x.posSalesL,
              cash: res.patch.cash ?? x.cash,
            }
          : x
      ),
      ledger: appendLedger(
        s.ledger,
        state.settings.role,
        "HYBRID_POS_IMPORTED",
        `POS sales imported for shift ${current.id}`,
        res.summary
      ),
    }));
    setMsg({ ok: true, text: `POS sales applied: ${res.summary.join(" · ")}` });
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/20 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-amber-300">
          Hybrid Mode · One-Click POS Sales CSV / JSON Import
        </p>
        <button
          type="button"
          className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-amber-400"
          onClick={() => setRaw(SAMPLE_POS_JSON)}
        >
          Load Sample POS JSON
        </button>
      </div>
      <textarea
        className="field min-h-[96px] font-mono text-xs"
        placeholder='Paste POS JSON or CSV (e.g. tank_id,pos_sales_l)...'
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className="btn-accent text-sm" onClick={() => applyPos(raw)}>
          Apply POS Sales to Shift
        </button>
        <label className="btn-ghost cursor-pointer text-sm">
          <FileUp size={16} aria-hidden="true" />
          Import POS .CSV / .JSON
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const txt = await file.text();
              setRaw(txt);
              applyPos(txt);
            }}
          />
        </label>
      </div>
      {Object.keys(current.posSalesL ?? {}).length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300">
          <span>
            Active POS override:{" "}
            {tanks
              .filter((tk) => typeof current.posSalesL?.[tk.id] === "number")
              .map((tk) => `${tk.name}: ${fmt(current.posSalesL?.[tk.id], 0)} L`)
              .join(" · ")}
          </span>
          <button
            type="button"
            className="underline text-slate-300"
            onClick={() => patch((sh) => ({ ...sh, posSalesL: {} }))}
          >
            Clear POS override
          </button>
        </div>
      ) : null}
      {msg ? (
        <div className="mt-2">
          <Alert tone={msg.ok ? "ok" : "danger"}>{msg.text}</Alert>
        </div>
      ) : null}
    </div>
  );
}

function DeliveriesCard({
  current,
  tanks,
  deliveryTolPct,
  patch,
}: {
  current: Shift;
  tanks: Tank[];
  deliveryTolPct: number;
  patch: (fn: (sh: Shift) => Shift) => void;
}) {
  const { t } = useT();
  const [tankId, setTankId] = useState(tanks[0]?.id ?? "");
  const [pre, setPre] = useState(0);
  const [post, setPost] = useState(0);
  const [omni, setOmni] = useState<string>("");
  const [waybill, setWaybill] = useState("");

  const effectiveTankId = tanks.some((tk) => tk.id === tankId) ? tankId : (tanks[0]?.id ?? "");
  const selectedTank = tanks.find((tk) => tk.id === effectiveTankId);
  const gain = post - pre;
  const noteVal = omni === "" ? null : Number(omni);
  const diffPct = noteVal && noteVal > 0 ? (Math.abs(gain - noteVal) / noteVal) * 100 : null;
  const ullageOverflow = selectedTank ? post > selectedTank.capacityL : false;

  const add = () => {
    const d: Delivery = {
      tankId: effectiveTankId,
      preDropL: pre,
      postDropL: post,
      omnicommL: noteVal,
      deliveryNoteL: noteVal,
      waybillNo: waybill,
      gpsArrivalIso: null,
    };
    patch((sh) => ({ ...sh, deliveries: [...sh.deliveries, d] }));
    setPre(0);
    setPost(0);
    setOmni("");
    setWaybill("");
  };

  return (
    <Card title={t("stepDelivery")}>
      <div className="space-y-3">
        {current.deliveries.map((d, i) => {
          const dGain = d.postDropL - d.preDropL;
          const expected = d.deliveryNoteL ?? d.omnicommL;
          return (
            <p
              key={i}
              className="rounded-xl border border-slate-700 bg-slate-950/70 p-2.5 text-sm text-slate-100 sm:text-base"
            >
              <strong>{d.waybillNo || "Waybill —"}</strong> · {d.tankId} · Gain:{" "}
              <span className="font-mono font-bold text-emerald-300">+{fmt(dGain)} L</span>
              {expected ? ` (Delivery Note / Omnicomm: ${fmt(expected)} L)` : ""}
            </p>
          );
        })}
        <label className="block">
          <span className="label">Tank (Ullage Cap: {fmt(selectedTank?.capacityL ?? 0, 0)} L)</span>
          <select className="field" value={effectiveTankId} onChange={(e) => setTankId(e.target.value)}>
            {tanks.map((tk) => (
              <option key={tk.id} value={tk.id}>
                {tk.name} ({fmt(tk.capacityL, 0)} L)
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField label={t("preDrop")} value={pre} step="1" onChange={setPre} />
          <NumberField label={t("postDrop")} value={post} step="1" onChange={setPost} />
          <NumberField
            label={t("omnicommL")}
            value={omni}
            step="1"
            onChange={(v) => setOmni(String(v))}
          />
          <label className="block">
            <span className="label">{t("waybill")}</span>
            <input
              className="field"
              value={waybill}
              onChange={(e) => setWaybill(e.target.value)}
            />
          </label>
        </div>

        {diffPct !== null && diffPct > deliveryTolPct ? (
          <Alert tone="danger">
            Trigger 4 Alert: Gain ({fmt(gain)} L) differs from Delivery Note ({fmt(noteVal)} L) by{" "}
            {diffPct.toFixed(2)}% (&gt; ±{deliveryTolPct}%).
          </Alert>
        ) : null}
        {ullageOverflow ? (
          <Alert tone="danger">
            Ullage Breach: Post-drop volume ({fmt(post)} L) exceeds tank capacity (
            {fmt(selectedTank?.capacityL)} L).
          </Alert>
        ) : null}

        <button type="button" className="btn-ghost w-full" onClick={add}>
          <Plus size={20} aria-hidden="true" />
          {t("addDelivery")}
        </button>
      </div>
    </Card>
  );
}

function ClosingDipRow({
  tankId,
  tankName,
  tank,
  shift,
  waterThresholdMm,
  onWaterChange,
  onLock,
}: {
  tankId: string;
  tankName: string;
  tank: Tank;
  shift: Shift;
  waterThresholdMm: number;
  onWaterChange: (mm: number) => void;
  onLock: (cm: number, litres: number, atg: number | null, waterMm: number) => void;
}) {
  const { t } = useT();
  const { mutate, state } = useStore();
  const [cm, setCm] = useState<number>(0);
  const [atg, setAtg] = useState<string>("");
  const [waterMm, setWaterMm] = useState<number>(shift.waterMm?.[tankId] ?? 0);
  const [dipstickType, setDipstickType] = useState<DipstickType>("wooden");
  const litres = litresFromCm(tank, cm);
  const locked = typeof shift.closingL[tankId] === "number";

  const lock = () => {
    onLock(cm, litres, atg === "" ? null : Number(atg), waterMm);
    mutate((s) => ({
      ...s,
      dips: [
        ...s.dips,
        {
          id: `D-${Date.now()}`,
          ts: new Date().toISOString(),
          tankId,
          cm,
          litres,
          waterCm: waterMm > 0 ? Math.round((waterMm / 10) * 100) / 100 : 0,
          waterLitres: null,
          kind: "CLOSING",
          dipstickType,
          role: state.settings.role,
        },
      ],
      ledger: appendLedger(
        s.ledger,
        state.settings.role,
        "DIP_RECORDED",
        `${tankName} closing ${cm} cm = ${litres} L | water ${waterMm} mm [${dipstickType}]`,
        { tankId, cm, litres, waterMm, dipstickType, shiftId: shift.id }
      ),
    }));
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-extrabold text-ink">
          {tankName} · {t("closingL")}:{" "}
          <span className="font-mono text-emerald-300">
            {locked ? `${fmt(shift.closingL[tankId])} L ✓` : `${fmt(litres)} L`}
          </span>
        </p>
        {waterMm > waterThresholdMm ? (
          <span className="badge-locked">WATER INGRESS {waterMm} MM</span>
        ) : null}
      </div>

      <DipstickField value={dipstickType} onChange={setDipstickType} disabled={locked} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <NumberField label="Closing dip (cm)" value={cm} step="0.1" onChange={setCm} />
        <NumberField
          label={t("waterMm")}
          value={waterMm}
          step="0.5"
          hint={`Alert > ${waterThresholdMm} mm`}
          onChange={(v) => {
            setWaterMm(v);
            onWaterChange(v);
          }}
        />
        <NumberField
          label={t("atgClosing")}
          value={atg}
          step="1"
          onChange={(v) => setAtg(String(v))}
        />
      </div>

      <button type="button" className="btn-ghost w-full" onClick={lock} disabled={locked}>
        <Lock size={18} aria-hidden="true" />
        {locked ? `${t("recordDip")} ✓` : t("recordDip")}
      </button>
    </div>
  );
}

function AtgClosingRow({
  tank,
  shift,
  waterThresholdMm,
  patch,
}: {
  tank: Tank;
  shift: Shift;
  waterThresholdMm: number;
  patch: (fn: (sh: Shift) => Shift) => void;
}) {
  const atgVal = shift.atgL?.[tank.id];
  const waterVal = shift.waterMm?.[tank.id] ?? 0;

  return (
    <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-extrabold text-ink">
          <Droplets size={18} aria-hidden="true" className="text-amber-400" />
          {tank.name} — {tank.product}
        </p>
        <span className="font-mono text-sm font-bold text-emerald-300">
          {typeof atgVal === "number" ? `${fmt(atgVal)} L (ATG)` : "Awaiting ATG"}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField
          label="ATG Closing Volume (L)"
          value={typeof atgVal === "number" ? atgVal : ""}
          step="1"
          onChange={(v) =>
            patch((sh) => ({
              ...sh,
              atgL: { ...sh.atgL, [tank.id]: v },
              closingL: { ...sh.closingL, [tank.id]: v },
            }))
          }
        />
        <NumberField
          label="ATG Water Level (mm)"
          value={waterVal}
          step="0.5"
          hint={`Threshold > ${waterThresholdMm} mm`}
          onChange={(v) =>
            patch((sh) => ({
              ...sh,
              waterMm: { ...(sh.waterMm ?? {}), [tank.id]: v },
            }))
          }
        />
      </div>
    </div>
  );
}

function InvestigationCard({
  current,
  patch,
  role,
}: {
  current: Shift;
  patch: (fn: (sh: Shift) => Shift) => void;
  role: Role;
}) {
  const { t } = useT();
  const [cause, setCause] = useState<InvestigationCause>("CALIBRATION_DRIFT");
  const [note, setNote] = useState("");
  const { mutate } = useStore();

  const save = () => {
    if (!note.trim()) return;
    const ts = new Date().toISOString();
    patch((sh) => ({ ...sh, investigation: { cause, note: note.trim(), role, ts } }));
    mutate((s) => ({
      ...s,
      ledger: appendLedger(
        s.ledger,
        role,
        "VARIANCE_RESOLVED",
        `Shift ${current.id} root-cause logged: ${cause}`,
        { shiftId: current.id, cause, note: note.trim() }
      ),
    }));
  };

  if (current.investigation) {
    return (
      <Alert tone="ok">
        <CheckCircle2 size={20} aria-hidden="true" className="mr-1 inline" />
        {t("cause")}: {t(`cause${current.investigation.cause}` as Parameters<typeof t>[0])} —{" "}
        {current.investigation.note}
      </Alert>
    );
  }

  return (
    <Card title={t("investigation")}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">{t("cause")}</span>
          <select
            className="field"
            value={cause}
            onChange={(e) => setCause(e.target.value as InvestigationCause)}
          >
            {CAUSES.map((c) => (
              <option key={c} value={c}>
                {t(`cause${c}` as Parameters<typeof t>[0])}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t("investigationNote")}</span>
          <textarea
            className="field min-h-[96px]"
            placeholder="Describe dipstick check, calibration reading, delivery short-drop, or containment action..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button type="button" className="btn w-full" onClick={save} disabled={!note.trim()}>
          Save Root-Cause Classification
        </button>
      </div>
    </Card>
  );
}

function SignOffForm({
  enabled,
  role,
  reason,
  onSign,
  label,
  nameLabel,
  idLabel,
  signLabel,
  roleGateText,
}: {
  enabled: boolean;
  role: Role;
  reason: string;
  onSign: (name: string, supervisorId: string, role: Role) => void;
  label: string;
  nameLabel: string;
  idLabel: string;
  signLabel: string;
  roleGateText: string;
}) {
  const [name, setName] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const allowed = SIGN_ROLES.includes(role);
  const ready = enabled && allowed && name.trim() !== "" && supervisorId.trim() !== "";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">{nameLabel}</span>
          <input
            className="field"
            placeholder="Supervisor Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="label">{idLabel}</span>
          <input
            className="field font-mono"
            placeholder="e.g. SUP-042"
            value={supervisorId}
            onChange={(e) => setSupervisorId(e.target.value)}
          />
        </label>
      </div>
      {!allowed ? <Alert tone="danger">{roleGateText}</Alert> : null}
      {reason ? <Alert tone="danger">{reason}</Alert> : null}
      <button
        type="button"
        className="btn-accent w-full"
        disabled={!ready}
        onClick={() => onSign(name.trim(), supervisorId.trim(), role)}
      >
        <CheckCircle2 size={20} aria-hidden="true" />
        {label} ({signLabel})
      </button>
    </div>
  );
}
