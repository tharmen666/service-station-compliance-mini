"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckSquare, FileCheck2, PhoneCall, RotateCcw, Square } from "lucide-react";
import { resolveOhsMasterTemplate } from "@/data/genericOhsMasterTemplate";
import { siteSettingsToTemplateContext } from "@/lib/sitePlugin";
import { useStore } from "@/lib/store";
import { DRILLS, tr } from "@/lib/content";
import { authoritiesFor } from "@/lib/statutory";
import { Card, PageHeader, useT } from "@/components/ui";

export default function DrillsPage() {
  const { state } = useStore();
  const { t, lang } = useT();
  const [open, setOpen] = useState<string>(DRILLS[0].id);
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const { settings } = state;
  const country = settings.country;

  const ohsHydrated = useMemo(
    () => resolveOhsMasterTemplate(siteSettingsToTemplateContext(settings)),
    [settings]
  );

  const toggle = (drillId: string, idx: number, total: number) => {
    setChecked((prev) => {
      const arr = prev[drillId] ?? Array.from({ length: total }, () => false);
      const next = arr.slice();
      next[idx] = !next[idx];
      return { ...prev, [drillId]: next };
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("drillsTitle")}
        sub={`${settings.siteCode} · ${settings.stationName} (${settings.brandNetwork}) — ${t("drillsSub")}`}
      />

      {/* Hydrated Active Site Emergency SOP & Contacts Card */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-amber-300">
              <PhoneCall size={18} aria-hidden="true" />
              Active Site Emergency SOP — {settings.stationName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
              {settings.brandNetwork} · {settings.siteCode} · {settings.physicalAddress} · Mgr:{" "}
              {settings.section162Manager}
            </p>
          </div>
          <span className="rounded-lg border border-red-500/50 bg-red-950/60 px-2.5 py-1 font-mono text-xs font-extrabold text-red-200">
            EMS: {settings.emergencyContact}
          </span>
        </div>

        <ol className="mt-3 grid grid-cols-1 gap-1.5 text-xs text-slate-200 sm:grid-cols-2">
          {ohsHydrated.emergencyPlan.evacuationProcedure.map((step, i) => (
            <li
              key={i}
              className="rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-2"
            >
              <span className="mr-1.5 font-mono font-bold text-amber-300">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>

        <Link href="/ohs" className="btn-ghost mt-3 w-full text-sm">
          <FileCheck2 size={17} aria-hidden="true" className="text-emerald-400" />
          Open Full 13 Site Safe Work Procedures &amp; OHS Checklists
        </Link>
      </Card>
      {DRILLS.map((d) => {
        const isOpen = open === d.id;
        const marks = checked[d.id] ?? [];
        const done = marks.filter(Boolean).length;
        const auth = authoritiesFor(d.authorities, country);
        return (
          <section key={d.id} className="card">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? "" : d.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-3 text-left"
            >
              <span className="text-lg font-extrabold leading-snug text-ink">{tr(d.title, lang)}</span>
              <span className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-2.5 py-1 text-sm font-bold text-amber-300">
                {done}/{d.steps.length}
              </span>
            </button>
            <p className="mt-1 text-sm font-semibold text-muted">{auth.join(" · ")}</p>

            {isOpen ? (
              <div className="mt-4 space-y-2">
                <ol className="space-y-2">
                  {d.steps.map((s, i) => {
                    const on = !!marks[i];
                    return (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => toggle(d.id, i, d.steps.length)}
                          aria-pressed={on}
                          className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left text-base sm:text-lg ${
                            on
                              ? "border-emerald-500/60 bg-emerald-950/50 text-emerald-100"
                              : "border-slate-700 bg-slate-950/70 text-slate-100 hover:border-slate-500"
                          }`}
                        >
                          {on ? (
                            <CheckSquare size={26} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-400" />
                          ) : (
                            <Square size={26} aria-hidden="true" className="mt-0.5 shrink-0 text-slate-400" />
                          )}
                          <span>
                            <span className="font-extrabold text-amber-300">
                              {t("step")} {i + 1}.
                            </span>{" "}
                            {tr(s, lang)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <button
                  type="button"
                  className="btn-ghost mt-2 w-full"
                  onClick={() => setChecked((p) => ({ ...p, [d.id]: [] }))}
                >
                  <RotateCcw size={18} aria-hidden="true" />
                  {t("reset")}
                </button>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
