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
  { href: "/guide", key: "navGuide", icon: BookOpen },
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
      <div className="sticky top-0 z-20 w-full">
        <header className="border-b-4 border-accent bg-primary px-3 py-2.5 text-white sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold leading-tight sm:text-lg">{tr("appName")}</p>
              <p className="truncate text-xs text-slate-200 sm:text-sm">{state.settings.stationName}</p>
            </div>
            <div className="flex shrink-0 gap-1" role="group" aria-label={tr("langLabel")}>
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  aria-pressed={lang === l.code}
                  className={`min-h-[44px] min-w-[44px] rounded-lg px-2 text-sm font-extrabold ${
                    lang === l.code ? "bg-accent text-ink" : "bg-slate-700 text-white"
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        <nav
          aria-label="Primary navigation"
          className="no-scrollbar w-full overflow-x-auto overscroll-x-contain border-b-2 border-slate-300 bg-surface sm:overflow-x-visible"
        >
          <ul className="flex min-w-max gap-1 px-2 py-2 sm:min-w-0 sm:flex-wrap sm:gap-1.5 sm:px-3">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-sm font-bold sm:px-3 ${
                      active ? "bg-primary text-white" : "text-ink hover:bg-slate-200"
                    }`}
                  >
                    <Icon size={16} aria-hidden="true" className="shrink-0" />
                    {tr(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <main className="min-w-0 flex-1 px-3 py-4 sm:px-4">
        {loaded ? children : <p className="text-lg text-muted">…</p>}
      </main>

      <footer className="border-t-4 border-accent bg-primary px-4 py-4 text-center text-sm font-semibold text-white">
        <p className="flex items-center justify-center gap-2">
          <BookOpen size={16} aria-hidden="true" className="shrink-0" />
          <span className="break-words">{FOOTER_TEXT}</span>
        </p>
      </footer>
    </div>
  );
}
