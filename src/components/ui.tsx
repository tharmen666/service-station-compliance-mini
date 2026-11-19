"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { translate, type TKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

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
      <h1 className="text-3xl font-extrabold leading-tight text-ink">{title}</h1>
      {sub ? <p className="mt-1 text-lg text-muted">{sub}</p> : null}
    </header>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {title ? <h2 className="mb-3 text-xl font-extrabold text-ink">{title}</h2> : null}
      {children}
    </section>
  );
}

export function Alert({ tone, children }: { tone: "danger" | "ok" | "info"; children: ReactNode }) {
  const cls =
    tone === "danger"
      ? "border-red-700 bg-red-50 text-red-900"
      : tone === "ok"
      ? "border-green-700 bg-green-50 text-green-900"
      : "border-slate-500 bg-white text-ink";
  return <div className={`rounded-xl border-2 p-3 text-lg font-semibold ${cls}`}>{children}</div>;
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
