"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BookOpen,
  Box,
  Building2,
  Cable,
  ClipboardList,
  Database,
  Droplets,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { LANGS, translate, type TKey } from "@/lib/i18n";
import { CURRENCY_BY_COUNTRY, REGULATORY_DISCLAIMER, REGULATORY_REGIONS } from "@/lib/statutory";
import type { Country, Lang } from "@/lib/types";
import { FOOTER_TEXT } from "./ui";
import DemoModal, { DemoButton } from "./DemoVideo";

const NAV: { href: string; key: TKey; icon: typeof LayoutDashboard }[] = [
  { href: "/", key: "navDashboard", icon: LayoutDashboard },
  { href: "/guide", key: "navGuide", icon: BookOpen },
  { href: "/tanks", key: "navTanks", icon: Droplets },
  { href: "/shift", key: "navShift", icon: ClipboardList },
  { href: "/drills", key: "navDrills", icon: ShieldAlert },
  { href: "/ohs", key: "navOhs", icon: FileCheck2 },
  { href: "/training", key: "navTraining", icon: GraduationCap },
  { href: "/training-3d", key: "navTraining3d", icon: Box },
  { href: "/connectors", key: "navConnectors", icon: Cable },
  { href: "/ledger", key: "navLedger", icon: ScrollText },
  { href: "/settings", key: "navSettings", icon: Settings },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state, mutate, switchSite, updateActiveSiteProfile, loaded, storageOk } = useStore();
  const lang = state.settings.lang;
  const tr = (k: TKey) => translate(lang, k);
  const [online, setOnline] = useState(true);

  // Apply the active tenant palette to the document root (CSS variables).
  useEffect(() => {
    document.documentElement.dataset.tenant = state.settings.tenant;
  }, [state.settings.tenant]);

  // Track browser online/offline state for the offline-first queue indicator.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setOnline(window.navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  const setLang = (code: Lang) =>
    mutate((s) => ({ ...s, settings: { ...s.settings, lang: code } }));

  const setRegCountry = (country: Country) =>
    updateActiveSiteProfile({
      country,
      currency: CURRENCY_BY_COUNTRY[country],
    });

  const activeRegCountry: Country = REGULATORY_REGIONS.some(
    (r) => r.country === state.settings.country
  )
    ? state.settings.country
    : "Kenya";

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col bg-[#070d1e]">
      <div className="sticky top-0 z-20 w-full">
        <header className="border-b border-slate-800 bg-[#070d1e] px-3 py-2.5 text-slate-50 sm:px-4 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-mono text-[11px] font-black uppercase tracking-wider text-sky-400">
                  FORECOURT SENTINEL · MINI
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                  {online ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              <p className="truncate text-base font-black leading-tight text-white sm:text-lg">
                {tr("appName")}
              </p>
              <p className="truncate text-xs text-slate-300 sm:text-sm">
                {state.settings.brandNetwork} · {state.settings.siteCode} · {state.settings.country} (
                {state.settings.currency}) · {state.tanks.length} tanks
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={tr("langLabel")}>
              <DemoButton compact />
              <select
                aria-label={tr("langLabel")}
                value={lang}
                onChange={(e) => setLang(e.target.value as Lang)}
                className="min-h-[44px] rounded-xl border border-slate-700 bg-[#0b1329] px-2 text-xs font-extrabold text-slate-100 focus:border-amber-400 focus:outline-none sm:px-2.5 sm:text-sm"
              >
                {LANGS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.short}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Multi-Site Header Switcher */}
          <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-2">
            <label className="flex min-w-0 flex-1 items-center gap-2">
              <Building2 size={16} aria-hidden="true" className="shrink-0 text-amber-400" />
              <span className="sr-only">Active station switcher</span>
              <select
                aria-label="Active station switcher"
                value={state.activeSiteId}
                onChange={(e) => switchSite(e.target.value)}
                className="min-h-[44px] w-full min-w-0 rounded-xl border border-slate-700 bg-[#0b1329] px-2.5 text-xs font-extrabold text-slate-100 focus:border-amber-400 focus:outline-none sm:text-sm"
              >
                {state.sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.siteCode} · {site.siteName} ({site.country})
                  </option>
                ))}
              </select>
            </label>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[11px] font-bold text-emerald-300">
                {state.sites.length} {state.sites.length === 1 ? "site" : "sites"}
              </span>
              <Link
                href="/settings#site-setup"
                className="inline-flex min-h-[40px] items-center rounded-xl border border-amber-500/40 bg-amber-950/40 px-2.5 py-1 text-xs font-extrabold text-amber-300 hover:border-amber-400"
              >
                Site Setup
              </Link>
            </div>
          </div>
        </header>

        {/* Offline-First Queue & Storage Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-950/95 px-3 py-1.5 text-xs sm:px-4">
          <div className="flex items-center gap-1.5 font-bold">
            {online ? (
              <Wifi size={14} aria-hidden="true" className="text-emerald-400" />
            ) : (
              <WifiOff size={14} aria-hidden="true" className="text-amber-400" />
            )}
            <span className={online ? "text-emerald-300" : "text-amber-300"}>
              {online ? tr("offlineReady") : tr("offlineActive")}
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-slate-400">
            <Database size={13} aria-hidden="true" className="text-sky-400" />
            <span>
              {storageOk ? "Saved locally" : "Memory mode"} · {state.shifts.length} shifts ·{" "}
              {state.ledger.length} ledger hashes
            </span>
          </div>
        </div>

        <nav
          aria-label="Primary navigation"
          className="no-scrollbar w-full overflow-x-auto overscroll-x-contain border-b border-slate-800 bg-[#0b1329] sm:overflow-x-visible"
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
                    className={`flex min-h-[44px] items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-sm font-bold transition-colors sm:px-3 ${
                      active
                        ? "bg-amber-500 font-black text-slate-950 shadow-sm"
                        : "text-slate-200 hover:bg-slate-800/80"
                    }`}
                  >
                    <Icon
                      size={16}
                      aria-hidden="true"
                      className={`shrink-0 ${active ? "text-slate-950" : "text-slate-300"}`}
                    />
                    {tr(item.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <main className="min-w-0 flex-1 px-3 py-4 sm:px-4">
        {loaded ? children : <p className="text-lg text-muted">Loading forecourt workspace…</p>}
      </main>

      <DemoModal />

      {/* Honest Regulatory Guardrail Footer (1:1 Enterprise Palette) */}
      <footer className="border-t border-slate-800/80 bg-[#070d1e] px-3 py-4 text-slate-300 sm:px-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-amber-400">
              <ShieldCheck size={16} aria-hidden="true" />
              Regulatory Support Profile
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select regulatory region">
              {REGULATORY_REGIONS.map((reg) => {
                const selected = activeRegCountry === reg.country;
                return (
                  <button
                    key={reg.country}
                    type="button"
                    onClick={() => setRegCountry(reg.country)}
                    aria-pressed={selected}
                    className={`min-h-[38px] rounded-lg border px-2.5 py-1 text-xs font-black transition-colors ${
                      selected
                        ? "border-cyan-400 bg-cyan-500 text-slate-950 shadow"
                        : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
                    }`}
                  >
                    {reg.badge}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="rounded-xl border border-slate-800 bg-[#0b1329] p-3 text-xs leading-relaxed text-slate-300">
            {REGULATORY_DISCLAIMER}
          </p>

          <p className="flex items-center justify-center gap-2 pt-1 text-center text-xs font-semibold text-slate-400 sm:text-sm">
            <BookOpen size={15} aria-hidden="true" className="shrink-0 text-amber-400" />
            <span className="break-words">{FOOTER_TEXT}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
