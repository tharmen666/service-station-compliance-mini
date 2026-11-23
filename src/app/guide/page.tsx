"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cable,
  CheckCircle2,
  ClipboardList,
  Download,
  Droplets,
  GraduationCap,
  ScrollText,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Card, PageHeader, useT } from "@/components/ui";
import type { TKey } from "@/lib/i18n";

const FEATURES: { titleKey: TKey; bodyKey: TKey; icon: typeof Droplets }[] = [
  { titleKey: "guideFeat1Title", bodyKey: "guideFeat1Body", icon: Droplets },
  { titleKey: "guideFeat2Title", bodyKey: "guideFeat2Body", icon: ClipboardList },
  { titleKey: "guideFeat3Title", bodyKey: "guideFeat3Body", icon: Cable },
  { titleKey: "guideFeat4Title", bodyKey: "guideFeat4Body", icon: ShieldAlert },
  { titleKey: "guideFeat5Title", bodyKey: "guideFeat5Body", icon: ShieldCheck },
];

const INSTALL_STEPS: { titleKey: TKey; bodyKey: TKey }[] = [
  { titleKey: "guideInstall1Title", bodyKey: "guideInstall1Body" },
  { titleKey: "guideInstall2Title", bodyKey: "guideInstall2Body" },
  { titleKey: "guideInstall3Title", bodyKey: "guideInstall3Body" },
  { titleKey: "guideInstall4Title", bodyKey: "guideInstall4Body" },
];

const USAGE_STEPS: {
  titleKey: TKey;
  bodyKey: TKey;
  href: string;
  ctaKey: TKey;
  icon: typeof Droplets;
}[] = [
  { titleKey: "guideUsage1Title", bodyKey: "guideUsage1Body", href: "/tanks", ctaKey: "navTanks", icon: Droplets },
  { titleKey: "guideUsage2Title", bodyKey: "guideUsage2Body", href: "/shift", ctaKey: "navShift", icon: ClipboardList },
  { titleKey: "guideUsage3Title", bodyKey: "guideUsage3Body", href: "/shift", ctaKey: "navShift", icon: ClipboardList },
  { titleKey: "guideUsage4Title", bodyKey: "guideUsage4Body", href: "/shift", ctaKey: "navShift", icon: ShieldCheck },
  { titleKey: "guideUsage5Title", bodyKey: "guideUsage5Body", href: "/drills", ctaKey: "navDrills", icon: GraduationCap },
  { titleKey: "guideUsage6Title", bodyKey: "guideUsage6Body", href: "/connectors", ctaKey: "navConnectors", icon: ScrollText },
];

export default function GuidePage() {
  const { t } = useT();

  return (
    <div className="space-y-4">
      <PageHeader title={t("guideTitle")} sub={t("guideSub")} />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Guide sections">
        <a href="#executive" className="btn-ghost min-h-[48px] px-2 text-center text-sm sm:text-base">
          {t("guideJumpExec")}
        </a>
        <a href="#features" className="btn-ghost min-h-[48px] px-2 text-center text-sm sm:text-base">
          {t("guideJumpFeatures")}
        </a>
        <a href="#install" className="btn-ghost min-h-[48px] px-2 text-center text-sm sm:text-base">
          {t("guideJumpInstall")}
        </a>
        <a href="#usage" className="btn-ghost min-h-[48px] px-2 text-center text-sm sm:text-base">
          {t("guideJumpUsage")}
        </a>
      </div>

      <section id="executive" className="scroll-mt-36">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen size={22} aria-hidden="true" className="shrink-0 text-amber-400" />
            <h2 className="text-xl font-extrabold text-ink">{t("guideExecTitle")}</h2>
          </div>
          <div className="space-y-3 text-base leading-relaxed text-slate-200 sm:text-lg">
            <p className="font-semibold text-slate-50">{t("guideExecP1")}</p>
            <p>{t("guideExecP2")}</p>
          </div>
        </Card>
      </section>

      <section id="features" className="scroll-mt-36">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 size={22} aria-hidden="true" className="shrink-0 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-ink">{t("guideFeaturesTitle")}</h2>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.titleKey} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                  <div className="flex items-start gap-2.5">
                    <Icon size={20} aria-hidden="true" className="mt-1 shrink-0 text-amber-400" />
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold leading-snug text-ink sm:text-lg">
                        {t(f.titleKey)}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
                        {t(f.bodyKey)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </section>

      <section id="install" className="scroll-mt-36">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Download size={22} aria-hidden="true" className="shrink-0 text-amber-400" />
            <h2 className="text-xl font-extrabold text-ink">{t("guideInstallTitle")}</h2>
          </div>
          <ol className="space-y-3">
            {INSTALL_STEPS.map((s, idx) => (
              <li key={s.titleKey} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold leading-snug text-ink sm:text-lg">
                      {t(s.titleKey)}
                    </h3>
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted sm:text-base">
                      {t(s.bodyKey)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/settings" className="btn-ghost w-full">
              <Settings size={18} aria-hidden="true" />
              {t("navSettings")}
            </Link>
            <Link href="/connectors" className="btn-ghost w-full">
              <Cable size={18} aria-hidden="true" />
              {t("navConnectors")}
            </Link>
          </div>
        </Card>
      </section>

      <section id="usage" className="scroll-mt-36">
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <Wrench size={22} aria-hidden="true" className="shrink-0 text-amber-400" />
            <h2 className="text-xl font-extrabold text-ink">{t("guideUsageTitle")}</h2>
          </div>
          <ol className="space-y-3">
            {USAGE_STEPS.map((s, idx) => (
              <li key={s.titleKey} className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-sm font-extrabold text-slate-950">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-extrabold leading-snug text-ink sm:text-lg">
                      {t(s.titleKey)}
                    </h3>
                    <p className="mt-1 break-words text-sm leading-relaxed text-muted sm:text-base">
                      {t(s.bodyKey)}
                    </p>
                    <Link
                      href={s.href}
                      className="mt-2 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-extrabold text-amber-300 underline underline-offset-2"
                    >
                      {t(s.ctaKey)}
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}
