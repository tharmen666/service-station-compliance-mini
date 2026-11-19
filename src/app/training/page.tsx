"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { SLIDES, tr } from "@/lib/content";
import { appendLedger } from "@/lib/ledger";
import { Alert, PageHeader, useT } from "@/components/ui";

export default function TrainingPage() {
  const { state, mutate } = useStore();
  const { t, lang } = useT();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const total = SLIDES.length;
  const signedOff = state.trainingSignoffs.includes(`slide-set-${lang}`);

  const signOff = () => {
    mutate((s) => ({
      ...s,
      trainingSignoffs: [...s.trainingSignoffs, `slide-set-${lang}`],
      ledger: appendLedger(s.ledger, s.settings.role, "TRAINING_SIGNOFF", `Rollout deck completed (${lang})`, { lang, slides: total }),
    }));
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("trainingTitle")} sub={t("trainingSub")} />

      <section
        className="card min-h-[320px] bg-white"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") setI((x) => Math.min(total - 1, x + 1));
          if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
        }}
        aria-label={t("trainingTitle")}
      >
        <p className="text-sm font-extrabold uppercase tracking-wide text-muted">
          {t("slideOf")} {i + 1} / {total}
        </p>
        <h2 className="mt-2 text-2xl font-extrabold leading-tight text-primary">{tr(slide.title, lang)}</h2>
        <ul className="mt-4 space-y-3 text-xl leading-snug">
          {slide.bullets.map((b, idx) => (
            <li key={idx} className="flex gap-3">
              <span aria-hidden="true" className="mt-2 h-3 w-3 shrink-0 rounded-sm bg-accent" />
              <span>{tr(b, lang)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        <button type="button" className="btn-ghost flex-1" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          <ChevronLeft size={22} aria-hidden="true" />
          {t("prev")}
        </button>
        <button type="button" className="btn flex-1" onClick={() => setI((x) => Math.min(total - 1, x + 1))} disabled={i === total - 1}>
          {t("next")}
          <ChevronRight size={22} aria-hidden="true" />
        </button>
      </div>

      <div className="flex justify-center gap-2" role="tablist" aria-label={t("slideOf")}>
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={`${t("slideOf")} ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-3 w-3 rounded-full ${idx === i ? "bg-primary" : "bg-slate-400"}`}
          />
        ))}
      </div>

      {signedOff ? (
        <Alert tone="ok">{t("trainingSigned")}</Alert>
      ) : (
        <button type="button" className="btn-accent w-full" onClick={signOff} disabled={i !== total - 1}>
          <ClipboardCheck size={20} aria-hidden="true" />
          {t("signTraining")}
        </button>
      )}
    </div>
  );
}
