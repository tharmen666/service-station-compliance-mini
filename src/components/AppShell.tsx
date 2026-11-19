"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  BookOpen,
  Cable,
  ClipboardList,
  Droplets,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { LANGS, translate, type TKey } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { FOOTER_TEXT } from "./ui";

const NAV: { href: string; key: TKey; icon: typeof LayoutDashboard }[] = [
  { href: "/", key: "navDashboard", icon: LayoutDashboard },
  { href: "/tanks", key: "navTanks", icon: Droplets },
  { href: "/shift", key: "navShift", icon: ClipboardList },
  { href: "/drills", key: "navDrills", icon: ShieldAlert },
  { href: "/training", key: "navTraining", icon: GraduationCap },
  { href: "/connectors", key: "navConnectors", icon: Cable },
  { href: "/ledger", key: "navLedger", icon: ScrollText },
  { href: "/settings", key: "navSettings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, mutate, loaded } = useStore();
  const lang = state.settings.lang;
  const tr = (k: TKey) => translate(lang, k);

  // Apply the active tenant palette to the document root (CSS variables).
  useEffect(() => {
    document.documentElement.dataset.tenant = state.settings.tenant;
  }, [state.settings.tenant]);

  const setLang = (code: Lang) =>
    mutate((s) => ({ ...s, settings: { ...s.settings, lang: code } }));

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col">
      <header className="sticky top-0 z-20 border-b-4 border-accent bg-primary px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold leading-tight">{tr("appName")}</p>
            <p className="truncate text-sm text-slate-200">{state.settings.stationName}</p>
          </div>
          <div className="flex shrink-0 gap-1" role="group" aria-label={tr("langLabel")}>
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                className={`rounded-lg px-2 text-sm font-extrabold ${
                  lang === l.code ? "bg-accent text-ink" : "bg-slate-700 text-white"
                }`}
              >
                {l.code.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </header>

      <nav className="sticky top-[88px] z-10 overflow-x-auto border-b-2 border-slate-300 bg-surface">
        <ul className="flex min-w-max gap-1 px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[48px] items-center gap-2 rounded-xl px-3 text-base font-bold ${
                    active ? "bg-primary text-white" : "text-ink hover:bg-slate-200"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" />
                  {tr(item.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="flex-1 px-4 py-4">
        {loaded ? children : <p className="text-lg text-muted">…</p>}
      </main>

      <footer className="border-t-4 border-accent bg-primary px-4 py-4 text-center text-sm font-semibold text-white">
        <p className="flex items-center justify-center gap-2">
          <BookOpen size={16} aria-hidden="true" />
          {FOOTER_TEXT}
        </p>
      </footer>
    </div>
  );
}
