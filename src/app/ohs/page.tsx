"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  PhoneCall,
  Printer,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { AwarenessCertificateCard } from "@/components/AwarenessCertificateCard";
import { Alert, Card, PageHeader } from "@/components/ui";
import { resolveOhsMasterTemplate, type RiskBand } from "@/data/genericOhsMasterTemplate";
import { appendLedger } from "@/lib/ledger";
import { siteSettingsToTemplateContext } from "@/lib/sitePlugin";
import { STATUTORY } from "@/lib/statutory";
import { useStore } from "@/lib/store";
import type { OhsChecklistStatus } from "@/lib/types";

type OhsTab =
  | "checklists"
  | "registers"
  | "emergency"
  | "risk"
  | "appointments"
  | "training";

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function riskBadgeClass(band: RiskBand): string {
  switch (band) {
    case "Low":
      return "border-emerald-500/50 bg-emerald-950/60 text-emerald-200";
    case "Medium":
      return "border-amber-500/50 bg-amber-950/60 text-amber-200";
    case "High":
      return "border-orange-500/60 bg-orange-950/60 text-orange-200";
    case "Critical":
      return "border-red-500/70 bg-red-950/70 text-red-200";
  }
}

export default function OhsPage() {
  const { state, mutate, setOhsChecklistMark } = useStore();
  const { settings, ohsChecklistMarks } = state;

  const [activeTab, setActiveTab] = useState<OhsTab>("checklists");
  const [checklistCadence, setChecklistCadence] = useState<"daily" | "weekly" | "monthly">("daily");
  const [sealedNotice, setSealedNotice] = useState<string | null>(null);
  const [riskAreaFilter, setRiskAreaFilter] = useState<string>("ALL");
  const [openSopId, setOpenSopId] = useState<string>("sop-9-1");
  const [selectedApptId, setSelectedApptId] = useState<string>("appt-16-2");

  const template = useMemo(
    () => resolveOhsMasterTemplate(siteSettingsToTemplateContext(settings)),
    [settings]
  );
  const statutory = STATUTORY[settings.country];

  const activeChecklist = template.inspectionChecklists[checklistCadence];
  const marksForChecklist = ohsChecklistMarks?.[activeChecklist.id] ?? {};
  const checkedCount = activeChecklist.items.filter((it) => Boolean(marksForChecklist[it.id])).length;
  const defectCount = activeChecklist.items.filter(
    (it) => marksForChecklist[it.id] === "NOT_OK"
  ).length;

  const sealChecklistToLedger = () => {
    const okCount = activeChecklist.items.filter((it) => marksForChecklist[it.id] === "OK").length;
    const naCount = activeChecklist.items.filter((it) => marksForChecklist[it.id] === "NA").length;
    mutate((s) => ({
      ...s,
      ledger: appendLedger(
        s.ledger,
        s.settings.role,
        "OHS_INSPECTION_SEALED",
        `${activeChecklist.title} (${s.settings.siteCode}): ${okCount} OK, ${defectCount} Not OK, ${naCount} N/A`,
        {
          siteCode: s.settings.siteCode,
          stationName: s.settings.stationName,
          checklistId: activeChecklist.id,
          checkedCount,
          totalItems: activeChecklist.items.length,
          defectCount,
        }
      ),
    }));
    setSealedNotice(
      `Sealed ${activeChecklist.frequency} checklist for ${settings.stationName} (${checkedCount}/${activeChecklist.items.length} checked, ${defectCount} defects) to SHA-256 ledger.`
    );
  };

  const riskAreas = useMemo(
    () => ["ALL", ...Array.from(new Set(template.riskAssessments.map((r) => r.area)))],
    [template.riskAssessments]
  );
  const filteredRisks = useMemo(
    () =>
      riskAreaFilter === "ALL"
        ? template.riskAssessments
        : template.riskAssessments.filter((r) => r.area === riskAreaFilter),
    [riskAreaFilter, template.riskAssessments]
  );

  const selectedAppointment =
    template.appointmentTemplates.find((a) => a.id === selectedApptId) ??
    template.appointmentTemplates[0];

  const exportHydratedPack = () => {
    downloadText(
      `ohs-master-pack-${settings.siteCode.toLowerCase()}.json`,
      JSON.stringify(template, null, 2),
      "application/json;charset=utf-8"
    );
  };

  const TABS: { id: OhsTab; label: string; icon: typeof ClipboardCheck }[] = [
    { id: "checklists", label: "Checklists", icon: ClipboardCheck },
    { id: "registers", label: "Registers & Certs", icon: FileCheck2 },
    { id: "emergency", label: "Emergency & SOPs", icon: PhoneCall },
    { id: "risk", label: "HIRA & 12 LSRs", icon: ShieldAlert },
    { id: "appointments", label: "Appointments", icon: FileText },
    { id: "training", label: "Training & Policies", icon: GraduationCap },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={template.meta.documentTitle}
        sub={`${template.meta.subtitle} · ${settings.physicalAddress} · ${settings.country}`}
      />

      {/* Dynamic Hydrated Site OHS Header Card */}
      <section className="card border-amber-500/40 bg-slate-900/95">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md border border-amber-400/50 bg-amber-950/60 px-2 py-0.5 font-mono text-xs font-black text-amber-300">
                {settings.siteCode}
              </span>
              <span className="rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2 py-0.5 text-xs font-bold text-emerald-300">
                {settings.brandNetwork}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs font-bold text-slate-300">
                {settings.tankCount} Tanks · {settings.dispenserCount} Dispensers
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">{template.meta.governanceNote}</p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:grid-cols-2 sm:text-sm">
          <div>
            <dt className="font-bold text-slate-400">16(2) Assigned Manager</dt>
            <dd className="font-extrabold text-slate-100">{settings.section162Manager}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-400">Primary Emergency Contact</dt>
            <dd className="font-extrabold text-amber-300">{settings.emergencyContact}</dd>
          </div>
          <div>
            <dt className="font-bold text-slate-400">Statutory Authorities ({settings.country})</dt>
            <dd className="font-semibold text-slate-200">
              {statutory.ohs} · {statutory.energy} · {statutory.environment} · {statutory.standards}
            </dd>
          </div>
          <div>
            <dt className="font-bold text-slate-400">Physical Address</dt>
            <dd className="font-semibold text-slate-200">{settings.physicalAddress}</dd>
          </div>
        </dl>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <button type="button" className="btn-accent text-xs sm:text-sm" onClick={exportHydratedPack}>
            <Download size={16} aria-hidden="true" />
            Export Hydrated OHS Pack (JSON)
          </button>
          <button type="button" className="btn-ghost text-xs sm:text-sm" onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" />
            Print OHS Summary
          </button>
          <Link href="/settings#site-setup" className="btn-ghost text-xs sm:text-sm">
            <Settings size={16} aria-hidden="true" />
            Edit Site Profile / Import Sitelist
          </Link>
        </div>
      </section>

      {/* Section Tabs */}
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        role="tablist"
        aria-label="OHS Master File Sections"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              className={`flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-extrabold transition-colors sm:text-sm ${
                active
                  ? "border-amber-400 bg-amber-500 text-slate-950"
                  : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DAILY / WEEKLY / MONTHLY CHECKLISTS */}
      {activeTab === "checklists" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Checklist frequency">
            {(["daily", "weekly", "monthly"] as const).map((freq) => {
              const active = checklistCadence === freq;
              const label =
                freq === "daily"
                  ? `Daily (${template.inspectionChecklists.daily.items.length})`
                  : freq === "weekly"
                  ? `Weekly (${template.inspectionChecklists.weekly.items.length})`
                  : `Monthly (${template.inspectionChecklists.monthly.items.length})`;
              return (
                <button
                  key={freq}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setChecklistCadence(freq);
                    setSealedNotice(null);
                  }}
                  className={`min-h-[46px] rounded-xl border px-2 py-2 text-xs font-extrabold sm:text-sm ${
                    active
                      ? "border-sky-400 bg-sky-500 text-slate-950"
                      : "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <Card title={activeChecklist.title}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300 sm:text-sm">
              <span>
                <strong>Cadence:</strong> {activeChecklist.frequency} · <strong>Responsible:</strong>{" "}
                {activeChecklist.responsible}
              </span>
              <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono font-bold text-amber-300">
                {checkedCount}/{activeChecklist.items.length} checked · {defectCount} Not OK
              </span>
            </div>

            <div className="space-y-2">
              {activeChecklist.items.map((item, idx) => {
                const status = marksForChecklist[item.id];
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      status === "NOT_OK"
                        ? "border-red-500/60 bg-red-950/35"
                        : status === "OK"
                        ? "border-emerald-500/50 bg-emerald-950/25"
                        : "border-slate-700 bg-slate-950/70"
                    }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs font-bold text-amber-300">
                          #{idx + 1} · {item.category}
                        </span>
                        <p className="mt-1 text-sm font-semibold text-slate-100 sm:text-base">
                          {item.text}
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-1.5" role="group" aria-label={`Status for ${item.text}`}>
                        {(
                          [
                            { val: "OK", label: "OK", cls: "border-emerald-400 bg-emerald-600 text-white" },
                            { val: "NOT_OK", label: "Not OK", cls: "border-red-400 bg-red-600 text-white" },
                            { val: "NA", label: "N/A", cls: "border-slate-400 bg-slate-600 text-white" },
                          ] as { val: OhsChecklistStatus; label: string; cls: string }[]
                        ).map((opt) => {
                          const selected = status === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              aria-pressed={selected}
                              onClick={() =>
                                setOhsChecklistMark(activeChecklist.id, item.id, opt.val)
                              }
                              className={`min-h-[44px] rounded-lg border px-3 text-xs font-extrabold transition-colors ${
                                selected
                                  ? opt.cls
                                  : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-accent mt-4 w-full"
              onClick={sealChecklistToLedger}
            >
              <ShieldCheck size={18} aria-hidden="true" />
              Seal Checklist Inspection to SHA-256 Ledger
            </button>

            {sealedNotice ? (
              <div className="mt-3">
                <Alert tone="ok">
                  <CheckCircle2 size={18} aria-hidden="true" className="mr-1.5 inline" />
                  {sealedNotice}
                </Alert>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {/* TAB 2: REGISTERS & STATUTORY CERTIFICATES */}
      {activeTab === "registers" ? (
        <div className="space-y-4">
          <Card title={`Site Profile & Facilities (${settings.siteCode})`}>
            <dl className="divide-y divide-slate-800 text-sm">
              {template.siteProfileFields.map((row) => (
                <div key={row.label} className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-3">
                  <dt className="font-bold text-slate-300">{row.label}</dt>
                  <dd className="text-slate-100 sm:col-span-2">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-3 border-t border-slate-800 pt-3">
              <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-amber-400">
                Standard Site Facilities Scope
              </p>
              <div className="flex flex-wrap gap-1.5">
                {template.siteFacilities.map((f) => (
                  <span
                    key={f}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Statutory Certificates & Licences Register (Section 19)">
            <ol className="space-y-1.5 text-sm text-slate-200">
              {template.statutoryCertificates.map((cert, i) => (
                <li
                  key={cert}
                  className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2"
                >
                  <span className="font-mono text-xs font-bold text-amber-300">
                    {String(i + 1).padStart(2, "0")}.
                  </span>
                  <span>{cert}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card title="OHS File Master Index (28 Statutory Elements)">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.complianceIndex.map((item) => (
                <div
                  key={item.number}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <span className="font-mono font-bold text-amber-300">
                    #{item.number} · {item.section}
                  </span>
                  <p className="mt-0.5 text-slate-200">{item.element}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="First Aid Box Statutory Contents (GSR 3)">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.equipmentRegisters.firstAidMinimumContents.map((fa) => (
                <div
                  key={fa.item}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs sm:text-sm"
                >
                  <span className="text-slate-100">{fa.item}</span>
                  <span className="shrink-0 font-mono font-bold text-emerald-300">
                    Min {fa.minQty}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Safety Signage Register (SANS 1186)">
            <div className="space-y-1.5">
              {template.equipmentRegisters.safetySignageRegister.map((sig) => (
                <div
                  key={sig.sign}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <p className="font-bold text-amber-300">{sig.sign}</p>
                  <p className="text-slate-300">Required at: {sig.requiredLocation}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Statutory Equipment & Safety Registers (Section 13)">
            <div className="space-y-3">
              {template.equipmentRegisters.registerSchemas.map((reg) => (
                <div
                  key={reg.id}
                  className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"
                >
                  <p className="text-sm font-extrabold text-slate-100">{reg.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{reg.subtitle}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {reg.columns.map((col) => (
                      <span
                        key={col}
                        className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[11px] text-sky-300"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {/* TAB 3: EMERGENCY PLAN & 13 SAFE WORK PROCEDURES */}
      {activeTab === "emergency" ? (
        <div className="space-y-4">
          <Card title={`Emergency Contacts & Team (${settings.stationName})`}>
            <p className="mb-3 text-sm text-slate-300">{template.emergencyPlan.intro}</p>
            <div className="space-y-2">
              {template.emergencyPlan.contacts.map((c) => (
                <div
                  key={c.service}
                  className="flex flex-col justify-between gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-3 sm:flex-row sm:items-center"
                >
                  <span className="text-sm font-bold text-slate-100">{c.service}</span>
                  <span className="font-mono text-xs font-extrabold text-amber-300 sm:text-sm">
                    {c.numberOrRef}
                  </span>
                </div>
              ))}
            </div>

            <h3 className="mt-4 mb-2 text-sm font-extrabold uppercase tracking-wide text-sky-400">
              Shift Emergency Team Roles
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.emergencyPlan.teamRoles.map((r) => (
                <div
                  key={r.role}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-slate-100">{r.role}</p>
                  <p className="text-slate-300">{r.shiftCoverage}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Site Evacuation Procedure & Specific Emergencies">
            <ol className="mb-4 space-y-2 text-sm text-slate-100">
              {template.emergencyPlan.evacuationProcedure.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 p-2.5"
                >
                  <span className="font-mono font-black text-amber-400">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="space-y-2">
              {template.emergencyPlan.specificEmergencies.map((em) => (
                <div
                  key={em.emergency}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-sm"
                >
                  <p className="font-extrabold text-amber-300">{em.emergency}</p>
                  <p className="mt-0.5 text-slate-200">{em.immediateActions}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Safe Work Procedures (${template.safeWorkProcedures.length} SOPs)`}>
            <div className="space-y-2">
              {template.safeWorkProcedures.map((sop) => {
                const isOpen = openSopId === sop.id;
                return (
                  <div
                    key={sop.id}
                    className="rounded-xl border border-slate-700 bg-slate-950/70 p-3"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenSopId(isOpen ? "" : sop.id)}
                      className="flex w-full items-center justify-between gap-2 text-left"
                    >
                      <span className="text-sm font-extrabold text-slate-100 sm:text-base">
                        <span className="mr-2 font-mono text-amber-300">{sop.code}</span>
                        {sop.title}
                      </span>
                      <span className="shrink-0 rounded-lg border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs font-bold text-slate-300">
                        {sop.steps.length} steps
                      </span>
                    </button>

                    {isOpen ? (
                      <ol className="mt-3 space-y-1.5 border-t border-slate-800 pt-2.5 text-sm text-slate-200">
                        {sop.steps.map((step, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="font-mono font-bold text-emerald-400">
                              {idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Incident Reporting Timelines & Investigation Protocol">
            <div className="space-y-2">
              {template.incidentManagement.reportingRules.map((rule) => (
                <div
                  key={rule.what}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-slate-100">{rule.what}</p>
                  <p className="mt-0.5 text-amber-300">
                    Report to: {rule.reportTo} · {rule.timeframe}
                  </p>
                  <p className="text-slate-400">Ref: {rule.reference}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      {/* TAB 4: BASELINE HIRA & 12 LIFE SAVING RULES */}
      {activeTab === "risk" ? (
        <div className="space-y-4">
          <Card title={`12 ${settings.brandNetwork} Life Saving Rules`}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.lifeSavingRules.map((rule) => (
                <div
                  key={rule.number}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-amber-300">
                    LSR {rule.number}. {rule.title}
                  </p>
                  <p className="mt-1 font-semibold text-slate-100">{rule.requirement}</p>
                  <p className="mt-1 text-slate-400">{rule.siteApplication}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-red-500/40 bg-red-950/25 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold uppercase text-red-300">
                <AlertTriangle size={14} aria-hidden="true" />
                Stop-Work &amp; Consequence Management
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-red-100 sm:text-sm">
                {template.lifeSavingRulesConsequence.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="5×5 Risk Matrix & Action Thresholds">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.riskMatrix.bands.map((b) => (
                <div
                  key={b.rating}
                  className={`rounded-xl border p-3 text-xs sm:text-sm ${riskBadgeClass(b.rating)}`}
                >
                  <p className="font-black">
                    {b.rating} Risk (Score {b.scoreRange})
                  </p>
                  <p className="mt-0.5">{b.actionRequired}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card
            title={`Baseline Risk Assessment Register (${filteredRisks.length} Hazards)`}
          >
            <label className="mb-3 block">
              <span className="label text-xs">Filter by Site Area</span>
              <select
                className="field text-sm"
                value={riskAreaFilter}
                onChange={(e) => setRiskAreaFilter(e.target.value)}
              >
                {riskAreas.map((area) => (
                  <option key={area} value={area}>
                    {area === "ALL" ? `All Areas (${template.riskAssessments.length})` : area}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              {filteredRisks.map((ra, idx) => (
                <div
                  key={ra.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-extrabold text-slate-100">
                      #{idx + 1} · {ra.area} — {ra.activity}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${riskBadgeClass(
                          ra.initialBand
                        )}`}
                      >
                        Init {ra.initialScore} ({ra.initialBand})
                      </span>
                      <span
                        className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${riskBadgeClass(
                          ra.residualBand
                        )}`}
                      >
                        Res {ra.residualScore} ({ra.residualBand})
                      </span>
                    </div>
                  </div>
                  <p className="mt-1 text-red-200">
                    <strong>Hazard:</strong> {ra.hazard} → {ra.consequence}
                  </p>
                  <p className="mt-1 text-emerald-200">
                    <strong>Controls:</strong> {ra.controls}
                  </p>
                  <p className="mt-1 text-slate-400">Owner: {ra.responsible}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Hazardous Chemical Register & PTRA Checks">
            <div className="mb-4 space-y-2">
              {template.hazardousChemicals.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-amber-300">
                    {ch.product} · <span className="text-slate-300">{ch.location}</span>
                  </p>
                  <p className="mt-0.5 text-slate-200">{ch.hazards}</p>
                  <p className="mt-0.5 text-emerald-300">PPE: {ch.ppe}</p>
                </div>
              ))}
            </div>

            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              Pre-Task Risk Assessment (PTRA / DSTI) Mandatory Field Checks
            </p>
            <ul className="space-y-1 text-xs text-slate-200 sm:text-sm">
              {template.ptraChecks.map((chk) => (
                <li key={chk} className="flex items-start gap-2">
                  <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{chk}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      {/* TAB 5: LEGAL APPOINTMENT TEMPLATES */}
      {activeTab === "appointments" ? (
        <div className="space-y-4">
          <Card
            title={`Statutory Appointment Templates (${template.appointmentTemplates.length} Roles)`}
          >
            <label className="mb-3 block">
              <span className="label">Select Statutory Appointment Letter</span>
              <select
                className="field"
                value={selectedAppointment.id}
                onChange={(e) => setSelectedApptId(e.target.value)}
              >
                {template.appointmentTemplates.map((appt) => (
                  <option key={appt.id} value={appt.id}>
                    {appt.title} ({appt.legalReference})
                  </option>
                ))}
              </select>
            </label>

            <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
              <p className="text-base font-extrabold text-amber-300">
                {selectedAppointment.title}
              </p>
              <p className="text-xs font-semibold text-sky-400">
                Legal Basis: {selectedAppointment.legalReference}
              </p>

              <h3 className="mt-3 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Assigned Statutory Duties
              </h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-200">
                {selectedAppointment.duties.map((duty) => (
                  <li key={duty}>{duty}</li>
                ))}
              </ul>

              <h3 className="mt-4 text-xs font-extrabold uppercase tracking-wide text-slate-400">
                Hydrated Appointment Letter Preview
              </h3>
              <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs leading-relaxed text-emerald-200">
                {selectedAppointment.letterTemplate}
              </pre>

              <button
                type="button"
                className="btn-accent mt-3 w-full text-sm"
                onClick={() =>
                  downloadText(
                    `${selectedAppointment.id}-${settings.siteCode.toLowerCase()}.txt`,
                    selectedAppointment.letterTemplate,
                    "text/plain;charset=utf-8"
                  )
                }
              >
                <Download size={16} aria-hidden="true" />
                Download Appointment Letter (.TXT)
              </button>
            </div>
          </Card>
        </div>
      ) : null}

      {/* TAB 6: TRAINING, INDUCTION, POLICIES & GOVERNANCE */}
      {activeTab === "training" ? (
        <div className="space-y-4">
          <AwarenessCertificateCard moduleTitle="Site OHS Master Induction & Forecourt Safety" />

          <Card title="Training Needs Matrix (16 Courses × 6 Roles)">
            <p className="mb-2 text-xs text-slate-400">
              R = Required before start · A = Required for appointees · O = Optional / as needed
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-amber-300">
                    <th className="py-2 pr-2">Course</th>
                    {template.trainingAndInduction.roles.map((r) => (
                      <th key={r} className="px-1.5 py-2 text-center">
                        {r}
                      </th>
                    ))}
                    <th className="py-2 pl-2">Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {template.trainingAndInduction.trainingMatrix.map((row) => (
                    <tr key={row.course} className="border-b border-slate-800">
                      <td className="py-2 pr-2 font-semibold text-slate-100">{row.course}</td>
                      {row.requirementsByRole.map((code, i) => (
                        <td
                          key={i}
                          className={`px-1.5 py-2 text-center font-mono font-bold ${
                            code === "R"
                              ? "text-emerald-300"
                              : code === "A"
                              ? "text-amber-300"
                              : "text-slate-500"
                          }`}
                        >
                          {code || "—"}
                        </td>
                      ))}
                      <td className="py-2 pl-2 text-slate-300">{row.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Site SHE Induction Checklist & 12-Month Toolbox Schedule">
            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              New Starter &amp; Contractor Induction Topics (14)
            </h3>
            <ul className="mb-4 grid grid-cols-1 gap-1.5 text-xs text-slate-200 sm:grid-cols-2 sm:text-sm">
              {template.trainingAndInduction.inductionChecklist.map((topic, i) => (
                <li
                  key={topic}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1.5"
                >
                  <span className="mr-1.5 font-mono font-bold text-amber-300">{i + 1}.</span>
                  {topic}
                </li>
              ))}
            </ul>

            <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              12-Month Toolbox Talk Schedule
            </h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {template.trainingAndInduction.toolboxTalkSchedule.map((tb) => (
                <div
                  key={tb.monthLabel}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs"
                >
                  <p className="font-mono font-extrabold text-amber-300">{tb.monthLabel}</p>
                  <p className="mt-0.5 text-slate-100">• {tb.topic1}</p>
                  <p className="text-slate-300">• {tb.topic2}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Site OHS Policies & Minimum PPE Matrix">
            <div className="space-y-3">
              {template.policies.map((pol) => (
                <div
                  key={pol.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs sm:text-sm"
                >
                  <p className="text-sm font-extrabold text-amber-300 sm:text-base">{pol.title}</p>
                  <p className="mt-1 text-slate-200">{pol.preamble}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
                    {pol.commitments.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <h3 className="mt-4 mb-2 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              Minimum Required PPE by Forecourt / Shop Zone
            </h3>
            <div className="space-y-1.5">
              {template.minimumPpeMatrix.map((row) => (
                <div
                  key={row.areaTask}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <span className="font-bold text-slate-100">{row.areaTask}:</span>{" "}
                  <span className="text-emerald-300">{row.minimumPpe}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`Legal Register, Contractor Control & Environmental Plan (${settings.country})`}>
            <div className="space-y-2">
              {template.legalRegister.map((leg) => (
                <div
                  key={leg.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-amber-300">{leg.legislation}</p>
                  <p className="mt-0.5 text-slate-300">{leg.keyRequirements}</p>
                </div>
              ))}
            </div>

            <h3 className="mt-4 mb-2 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              Environmental Management Plan
            </h3>
            <div className="space-y-1.5">
              {template.governance.environmentalManagementPlan.map((env) => (
                <div
                  key={env.aspect}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 text-xs sm:text-sm"
                >
                  <p className="font-extrabold text-emerald-300">
                    {env.aspect} — <span className="text-slate-300">{env.impact}</span>
                  </p>
                  <p className="mt-0.5 text-slate-200">{env.control}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <BookOpen size={14} aria-hidden="true" className="shrink-0 text-amber-400" />
              <span>{template.meta.confidentialityNote}</span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
