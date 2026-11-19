"use client";

import { useState } from "react";
import { CheckSquare, RotateCcw, Square } from "lucide-react";
import { useStore } from "@/lib/store";
import { DRILLS, tr } from "@/lib/content";
import { authoritiesFor } from "@/lib/statutory";
import { PageHeader, useT } from "@/components/ui";

export default function DrillsPage() {
  const { state } = useStore();
  const { t, lang } = useT();
  const [open, setOpen] = useState<string>(DRILLS[0].id);
  const [checked, setChecked] = useState<Record<string, boolean[]>>({});
  const country = state.settings.country;

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
      <PageHeader title={t("drillsTitle")} sub={t("drillsSub")} />
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
              <span className="text-lg font-extrabold leading-snug">{tr(d.title, lang)}</span>
              <span className="shrink-0 rounded-lg bg-slate-200 px-2 py-1 text-sm font-bold">
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
                          className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left text-lg ${
                            on ? "border-green-700 bg-green-50" : "border-slate-400 bg-white"
                          }`}
                        >
                          {on ? (
                            <CheckSquare size={26} aria-hidden="true" className="mt-0.5 shrink-0 text-green-800" />
                          ) : (
                            <Square size={26} aria-hidden="true" className="mt-0.5 shrink-0" />
                          )}
                          <span>
                            <span className="font-extrabold">
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
