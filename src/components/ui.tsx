"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { translate, type TKey } from "@/lib/i18n";
import type { DipstickType, Lang } from "@/lib/types";

export const FOOTER_TEXT = "Powered by Desigan Tharmen | G.E.A.R. Compliance Architecture";

/** Returns a translator bound to the current language setting. */
export function useT(): { t: (k: TKey) => string; lang: Lang } {
  const { state } = useStore();
  const lang = state.settings.lang;
  return { t: (k: TKey) => translate(lang, k), lang };
}

export function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <header className="mb-4">
      <h1 className="break-words text-2xl font-extrabold leading-tight text-ink sm:text-3xl">{title}</h1>
      {sub ? <p className="mt-1 break-words text-base text-muted sm:text-lg">{sub}</p> : null}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title ? <h2 className="mb-3 break-words text-xl font-extrabold text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Alert({ tone, children }: { tone: "danger" | "warn" | "ok" | "info"; children: ReactNode }) {
  const cls =
    tone === "danger"
      ? "border-red-700 bg-red-50 text-red-900"
      : tone === "warn"
      ? "border-amber-600 bg-amber-50 text-amber-950"
      : tone === "ok"
      ? "border-green-700 bg-green-50 text-green-900"
      : "border-slate-500 bg-white text-ink";
  return <div className={`break-words rounded-xl border-2 p-3 text-base font-semibold sm:text-lg ${cls}`}>{children}</div>;
}

export function DipstickField({
  value,
  onChange,
  disabled = false,
}: {
  value: DipstickType;
  onChange: (v: DipstickType) => void;
  disabled?: boolean;
}) {
  const { t } = useT();
  return (
    <div className="space-y-2">
      <label className="block">
        <span className="label">{t("dipstickMaterial")}</span>
        <select
          className="field"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value as DipstickType)}
        >
          <option value="wooden">{t("dipstickWooden")}</option>
          <option value="aluminium">{t("dipstickAluminium")}</option>
        </select>
      </label>
      {value === "aluminium" ? (
        <Alert tone="warn">
          <span className="flex items-start gap-2 text-base">
            <AlertTriangle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-amber-700" />
            <span>
              <strong className="block">{t("transitionAdvisoryTitle")}</strong>
              <span className="font-normal">{t("transitionAdvisoryBody")}</span>
            </span>
          </span>
        </Alert>
      ) : null}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = "any",
  min = 0,
  hint,
}: {
  label: string;
  value: number | string;
  onChange: (v: number) => void;
  step?: string;
  min?: number;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="field"
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint ? <span className="mt-1 block text-sm text-muted">{hint}</span> : null}
    </label>
  );
}

export function fmt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("en-KE", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
