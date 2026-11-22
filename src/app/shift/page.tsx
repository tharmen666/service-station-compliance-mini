"use client";

import { useState } from "react";
import { CheckCircle2, Lock, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShiftRecon, litresFromCm } from "@/lib/calc";
import { appendLedger } from "@/lib/ledger";
import { Alert, Card, DipstickField, NumberField, PageHeader, fmt, useT } from "@/components/ui";
import { HybridAiDiagnosticCard } from "@/components/HybridAiDiagnosticCard";
import type { Delivery, DipstickType, InvestigationCause, Role, Shift } from "@/lib/types";

const CAUSES: InvestigationCause[] = ["PUMP_CALIBRATION", "DRIVE_OFF", "SHORT_DROP", "TANK_LEAK", "CASH_SHORTFALL", "OTHER"];
const SIGN_ROLES: Role[] = ["Supervisor", "Station Manager"];

export default function ShiftPage() {
  const { state, mutate } = useStore();
  const { t } = useT();
  const { tanks, shifts, settings, nozzles } = state;
  const role = settings.role;

  const current = shifts.find((s) => s.status !== "CLOSED") ?? null;

  const openNewShift = () => {
    const last = [...shifts].reverse().find((s) => s.status === "CLOSED") ?? null;
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
      openingL,
      deliveries: [],
      meters,
      closingL: {},
      atgL: {},
      prices: last?.prices ?? {},
      cash: { cash: 0, mobileMoney: 0, card: 0 },
      investigation: null,
      signOff: null,
    };
    mutate((s) => ({
      ...s,
      shifts: [...s.shifts, shift],
      ledger: appendLedger(s.ledger, role, "SHIFT_OPENED", `Shift ${shift.id} opened`, { shiftId: shift.id, openingL }),
    }));
  };

  const patch = (fn: (sh: Shift) => Shift) => {
    if (!current) return;
    mutate((s) => ({ ...s, shifts: s.shifts.map((x) => (x.id === current.id ? fn(x) : x)) }));
  };

  if (!current) {
    return (
      <div className="space-y-4">
        <PageHeader title={t("shiftTitle")} sub={t("shiftSub")} />
        <button type="button" className="btn w-full" onClick={openNewShift}>
          <Plus size={20} aria-hidden="true" />
          {t("newShift")}
        </button>
      </div>
    );
  }

  const recon = computeShiftRecon(current, tanks, settings);
  const investigated = current.investigation !== null;
  const cleared = !recon.locked || investigated;
  const canSign = recon.allClosingEntered && cleared;
  const statusLabel = recon.locked && !investigated ? t("statusLocked") : t("statusOpen");

  const closeShift = (name: string, signRole: Role) => {
    const ts = new Date().toISOString();
    mutate((s) => ({
      ...s,
      shifts: s.shifts.map((x) =>
        x.id === current.id ? { ...x, status: "CLOSED", closedAt: ts, signOff: { name, role: signRole, ts } } : x
      ),
      ledger: appendLedger(s.ledger, signRole, "SHIFT_CLOSED", `Shift ${current.id} closed and signed by ${name}`, {
        shiftId: current.id,
        recon: recon,
        investigation: current.investigation,
      }),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("shiftTitle")} sub={`${current.id} · ${new Date(current.openedAt).toLocaleString()}`} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={recon.locked && !investigated ? "badge-locked" : "badge-open"}>{statusLabel}</span>
        <span className="text-sm font-bold text-muted">{t("role")}: {role}</span>
      </div>

      {recon.locked && !investigated ? (
        <Alert tone="danger">
          <strong>{t("statusLocked")}</strong>
          <br />
          {t("lockBanner")}
          <ul className="mt-2 list-disc pl-6">
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

      <DeliveriesCard current={current} patch={patch} />

      <Card title={t("stepMeters")}>
        <div className="space-y-3">
          {current.meters.map((m) => (
            <div key={m.id} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 sm:grid sm:grid-cols-3 sm:items-end sm:gap-2 sm:space-y-0 sm:border-0 sm:bg-transparent sm:p-0">
              <p className="text-base font-extrabold sm:pb-3 sm:text-lg">{m.name}</p>
              <div className="grid grid-cols-1 gap-2 min-[340px]:grid-cols-2 sm:contents">
                <NumberField
                  label={t("meterOpen")}
                  value={m.open}
                  step="1"
                  onChange={(v) => patch((sh) => ({ ...sh, meters: sh.meters.map((x) => (x.id === m.id ? { ...x, open: v } : x)) }))}
                />
                <NumberField
                  label={t("meterClose")}
                  value={m.close}
                  step="1"
                  onChange={(v) => patch((sh) => ({ ...sh, meters: sh.meters.map((x) => (x.id === m.id ? { ...x, close: v } : x)) }))}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t("stepClose")}>
        <div className="space-y-4">
          {tanks.map((tk) => (
            <ClosingDipRow key={tk.id} tankId={tk.id} tankName={tk.name} shift={current} onLock={(cm, L, atg) => patch((sh) => ({
              ...sh,
              closingL: { ...sh.closingL, [tk.id]: L },
              atgL: atg === null ? sh.atgL : { ...sh.atgL, [tk.id]: atg },
            }))} tank={tk} />
          ))}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {tanks.map((tk) => (
              <NumberField
                key={tk.id}
                label={`${tk.name} — ${t("price")}`}
                value={current.prices[tk.id] ?? 0}
                step="0.01"
                onChange={(v) => patch((sh) => ({ ...sh, prices: { ...sh.prices, [tk.id]: v } }))}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <NumberField label={`${t("cash")} (${settings.currency})`} value={current.cash.cash} step="1" onChange={(v) => patch((sh) => ({ ...sh, cash: { ...sh.cash, cash: v } }))} />
            <NumberField label={`${t("mobileMoney")} (${settings.currency})`} value={current.cash.mobileMoney} step="1" onChange={(v) => patch((sh) => ({ ...sh, cash: { ...sh.cash, mobileMoney: v } }))} />
            <NumberField label={`${t("card")} (${settings.currency})`} value={current.cash.card} step="1" onChange={(v) => patch((sh) => ({ ...sh, cash: { ...sh.cash, card: v } }))} />
          </div>
        </div>
      </Card>

      <Card title="Reconciliation">
        {/* Stacked mobile cards for 375px viewports */}
        <div className="space-y-2 sm:hidden">
          {recon.tanks.map((r) => (
            <div
              key={r.tankId}
              className={`rounded-xl border-2 p-3 ${r.locked ? "border-red-400 bg-red-50" : "border-slate-200 bg-white"}`}
            >
              <p className="text-base font-extrabold">{r.product.split(" ")[0]}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">{t("theoretical")}</dt>
                <dd className="text-right font-semibold">{fmt(r.theoreticalL)} L</dd>
                <dt className="text-muted">{t("closingL")}</dt>
                <dd className="text-right font-semibold">{r.closingL === null ? "—" : `${fmt(r.closingL)} L`}</dd>
                <dt className="text-muted">{t("variance")}</dt>
                <dd className="text-right font-extrabold">{r.varianceL === null ? "—" : `${fmt(r.varianceL)} L`}</dd>
                <dt className="text-muted">{t("tolerance")}</dt>
                <dd className="text-right font-semibold">±{fmt(r.tolL)} L</dd>
              </dl>
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[520px] text-left text-base">
            <thead>
              <tr className="border-b-2 border-slate-500">
                <th className="py-2">Tank</th>
                <th>{t("theoretical")}</th>
                <th>{t("closingL")}</th>
                <th>{t("variance")}</th>
                <th>{t("tolerance")}</th>
              </tr>
            </thead>
            <tbody>
              {recon.tanks.map((r) => (
                <tr key={r.tankId} className={`border-b border-slate-300 ${r.locked ? "bg-red-50" : ""}`}>
                  <td className="py-2 font-bold">{r.product.split(" ")[0]}</td>
                  <td>{fmt(r.theoreticalL)} L</td>
                  <td>{r.closingL === null ? "—" : `${fmt(r.closingL)} L`}</td>
                  <td className="font-bold">{r.varianceL === null ? "—" : `${fmt(r.varianceL)} L`}</td>
                  <td>±{fmt(r.tolL)} L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-base sm:grid-cols-3 sm:text-lg">
          <p>
            <span className="font-bold">{t("expectedRevenue")}:</span> {settings.currency} {fmt(recon.expectedRevenue, 0)}
          </p>
          <p>
            <span className="font-bold">{t("collected")}:</span> {settings.currency} {fmt(recon.collected, 0)}
          </p>
          <p>
            <span className="font-bold">{t("shortfall")}:</span> {settings.currency} {fmt(recon.shortfall, 0)}
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

      {recon.locked ? (
        <InvestigationCard current={current} patch={patch} role={role} />
      ) : null}

      <Card title={t("signOffTitle")}>
        <SignOffForm
          enabled={canSign}
          role={role}
          reason={!recon.allClosingEntered ? t("cannotClose") : !cleared ? t("lockBanner") : ""}
          onSign={closeShift}
          label={t("closeShift")}
          nameLabel={t("signOffName")}
          signLabel={t("signOff")}
          roleGateText={t("roleGate")}
        />
      </Card>
    </div>
  );
}

function DeliveriesCard({ current, patch }: { current: Shift; patch: (fn: (sh: Shift) => Shift) => void }) {
  const { t } = useT();
  const { state } = useStore();
  const [tankId, setTankId] = useState(state.tanks[0]?.id ?? "");
  const [pre, setPre] = useState(0);
  const [post, setPost] = useState(0);
  const [omni, setOmni] = useState<string>("");
  const [waybill, setWaybill] = useState("");

  const add = () => {
    const d: Delivery = {
      tankId,
      preDropL: pre,
      postDropL: post,
      omnicommL: omni === "" ? null : Number(omni),
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
        {current.deliveries.map((d, i) => (
          <p key={i} className="rounded-lg bg-white p-2 text-base">
            {d.waybillNo || "—"} · {d.tankId} · +{fmt(d.postDropL - d.preDropL)} L
            {d.omnicommL ? ` (Omnicomm ${fmt(d.omnicommL)} L)` : ""}
          </p>
        ))}
        <label className="block">
          <span className="label">Tank</span>
          <select className="field" value={tankId} onChange={(e) => setTankId(e.target.value)}>
            {state.tanks.map((tk) => (
              <option key={tk.id} value={tk.id}>{tk.name}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField label={t("preDrop")} value={pre} step="1" onChange={setPre} />
          <NumberField label={t("postDrop")} value={post} step="1" onChange={setPost} />
          <NumberField label={t("omnicommL")} value={omni} step="1" onChange={(v) => setOmni(String(v))} />
          <label className="block">
            <span className="label">{t("waybill")}</span>
            <input className="field" value={waybill} onChange={(e) => setWaybill(e.target.value)} />
          </label>
        </div>
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
  onLock,
}: {
  tankId: string;
  tankName: string;
  tank: import("@/lib/types").Tank;
  shift: Shift;
  onLock: (cm: number, litres: number, atg: number | null) => void;
}) {
  const { t } = useT();
  const { mutate, state } = useStore();
  const [cm, setCm] = useState<number>(0);
  const [atg, setAtg] = useState<string>("");
  const [dipstickType, setDipstickType] = useState<DipstickType>("wooden");
  const litres = litresFromCm(tank, cm);
  const locked = typeof shift.closingL[tankId] === "number";

  const lock = () => {
    onLock(cm, litres, atg === "" ? null : Number(atg));
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
          waterCm: null,
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
        `${tankName} closing ${cm} cm = ${litres} L [${dipstickType}]`,
        { tankId, cm, litres, dipstickType, shiftId: shift.id }
      ),
    }));
  };

  return (
    <div className="space-y-2 rounded-xl border-2 border-slate-300 bg-white p-3">
      <p className="font-extrabold">
        {tankName} · {t("closingL")}: {locked ? `${fmt(shift.closingL[tankId])} L ✓` : `${fmt(litres)} L`}
      </p>
      <DipstickField value={dipstickType} onChange={setDipstickType} disabled={locked} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <NumberField label="Closing dip (cm)" value={cm} step="0.1" onChange={setCm} />
        <NumberField label={t("atgClosing")} value={atg} step="1" onChange={(v) => setAtg(String(v))} />
      </div>
      <button type="button" className="btn-ghost w-full" onClick={lock} disabled={locked}>
        <Lock size={18} aria-hidden="true" />
        {t("recordDip")}
      </button>
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
  const [cause, setCause] = useState<InvestigationCause>("PUMP_CALIBRATION");
  const [note, setNote] = useState("");
  const { mutate } = useStore();

  const save = () => {
    if (!note.trim()) return;
    const ts = new Date().toISOString();
    patch((sh) => ({ ...sh, investigation: { cause, note: note.trim(), role, ts } }));
    mutate((s) => ({
      ...s,
      ledger: appendLedger(s.ledger, role, "VARIANCE_RESOLVED", `Shift ${current.id} investigation: ${cause}`, { cause, note: note.trim() }),
    }));
  };

  if (current.investigation) {
    return (
      <Alert tone="ok">
        <CheckCircle2 size={20} aria-hidden="true" className="mr-1 inline" />
        {t("cause")}: {t(`cause${current.investigation.cause}` as Parameters<typeof t>[0])} — {current.investigation.note}
      </Alert>
    );
  }

  return (
    <Card title={t("investigation")}>
      <div className="space-y-3">
        <label className="block">
          <span className="label">{t("cause")}</span>
          <select className="field" value={cause} onChange={(e) => setCause(e.target.value as InvestigationCause)}>
            {CAUSES.map((c) => (
              <option key={c} value={c}>{t(`cause${c}` as Parameters<typeof t>[0])}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label">{t("investigationNote")}</span>
          <textarea className="field min-h-[96px]" value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <button type="button" className="btn w-full" onClick={save} disabled={!note.trim()}>
          {t("save")}
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
  signLabel,
  roleGateText,
}: {
  enabled: boolean;
  role: Role;
  reason: string;
  onSign: (name: string, role: Role) => void;
  label: string;
  nameLabel: string;
  signLabel: string;
  roleGateText: string;
}) {
  const [name, setName] = useState("");
  const allowed = SIGN_ROLES.includes(role);
  const ready = enabled && allowed && name.trim() !== "";
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="label">{nameLabel}</span>
        <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {!allowed ? <Alert tone="danger">{roleGateText}</Alert> : null}
      {reason ? <Alert tone="danger">{reason}</Alert> : null}
      <button type="button" className="btn w-full" disabled={!ready} onClick={() => onSign(name.trim(), role)}>
        <CheckCircle2 size={20} aria-hidden="true" />
        {signLabel} · {label}
      </button>
    </div>
  );
}
