"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Box,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Flame,
  HeartPulse,
  Play,
  RotateCcw,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { appendLedger } from "@/lib/ledger";
import { pickBestVoice } from "@/lib/voiceBriefing";
import { AwarenessCertificateCard } from "@/components/AwarenessCertificateCard";
import { openDemo } from "@/components/DemoVideo";
import {
  Forecourt3DCanvas,
  type Drill3DMode,
  type ExtinguisherKind,
} from "@/components/Forecourt3DCanvas";
import { Alert, Card, PageHeader } from "@/components/ui";

interface DrillStepMeta {
  title: string;
  action: string;
  tip: string;
}

const PASS_STEPS: DrillStepMeta[] = [
  {
    title: "1. Pull Pin",
    action: "Break the tamper seal and pull the safety pin from the extinguisher handle while standing upwind.",
    tip: "Do not squeeze the lever while pulling the pin or the locking pin jams.",
  },
  {
    title: "2. Aim Low",
    action: "Aim the horn/nozzle directly at the base of the fuel pan fire — never into the upper flames.",
    tip: "Petrol/diesel fires burn on liquid surface vapors; smothering the base starves the fire.",
  },
  {
    title: "3. Squeeze",
    action: "Squeeze the operating lever firmly to discharge the 9kg DCP or CO2 agent at the fire base.",
    tip: "Maintain a safe 2–3 meter upwind stand-off distance.",
  },
  {
    title: "4. Sweep",
    action: "Sweep side-to-side smoothly across the base until all flames are extinguished, then watch for re-ignition.",
    tip: "Never turn your back on an extinguished hydrocarbon pan.",
  },
];

const SPILL_STEPS: DrillStepMeta[] = [
  {
    title: "1. Hit E-Stop",
    action: "Trigger the Emergency Shut-Off (ESD) button immediately to isolate all forecourt fuel dispensers.",
    tip: "Eliminate all ignition sources — engines off, no phones, no smoking.",
  },
  {
    title: "2. Cordon with Cones",
    action: "Deploy safety cones and hazard perimeter around the spill zone and keep customers upwind.",
    tip: "Prevent vehicles from driving through the fuel slick.",
  },
  {
    title: "3. Dam Stormwater Drain with Boom",
    action: "Place hydrophobic absorbent booms around the stormwater grate before fuel reaches public drains.",
    tip: "NEVER wash fuel spills into stormwater drains with water hoses.",
  },
  {
    title: "4. Apply Absorbents",
    action: "Spread oil-absorbent granules or pads across the fuel puddle from the outside edge inward.",
    tip: "Wear nitrile chemical gloves, safety boots, and eye protection.",
  },
  {
    title: "5. Bag Hazmat Waste & Log",
    action: "Scoop saturated absorbent into labelled UN hazmat drums/bags and log the incident in the SHA-256 ledger.",
    tip: "Report large spills or drain breaches to statutory environmental authorities.",
  },
];

const EMS_BY_COUNTRY: Record<string, string> = {
  Kenya: "999 / 112 / 1199 (St John)",
  Tanzania: "114 / 112",
  Ghana: "193 / 112",
  "South Africa": "10177 / 112",
  Uganda: "999 / 112",
  Rwanda: "912 / 112",
};

export default function Training3DPage() {
  const { state, mutate } = useStore();
  const { settings, completedDrills } = state;

  const [mode, setMode] = useState<Drill3DMode>("pass");
  const [step, setStep] = useState<number>(0);
  const [extinguisher, setExtinguisher] = useState<ExtinguisherKind>("dcp");
  const [resetToken, setResetToken] = useState(0);
  const [trainerOpen, setTrainerOpen] = useState(false);
  const [localVideoFound, setLocalVideoFound] = useState<"checking" | "available" | "missing">("checking");
  const [videoLoadErr, setVideoLoadErr] = useState(false);
  const [signedNotice, setSignedNotice] = useState<string | null>(null);

  const emsNumber = EMS_BY_COUNTRY[settings.country] ?? "112 / 999";

  const FIRST_AID_STEPS: DrillStepMeta[] = [
    {
      title: "1. Scene Safety, ESD & Nitrile PPE",
      action: "Hit ESD if near dispensers, cordon the bay with cones, and put on nitrile gloves before touching any casualty.",
      tip: "Never render aid in an active traffic lane or fuel spill zone.",
    },
    {
      title: "2. Check Responsiveness & Airway (DRABC)",
      action: "Check Danger, tap shoulders to check Response, inspect Airway and normal Breathing for 10 seconds.",
      tip: "Do not move the casualty if vehicle impact spinal trauma is suspected.",
    },
    {
      title: "3. Call EMS & Cashier Bridge",
      action: `Signal the cashier immediately to call EMS (${emsNumber}) with location, conscious state, and injury details.`,
      tip: "Station an attendant at the forecourt entrance to wave the ambulance straight in.",
    },
    {
      title: "4. Recovery Position & Fuel Splash Flush",
      action: "If breathing and no spinal risk, place in Recovery Position; for fuel/eye splashes or burns, flush with cool running water for 15–20 minutes (NEVER apply butter or oil).",
      tip: "Remove fuel-soaked clothing immediately to prevent chemical skin burns.",
    },
    {
      title: "5. Monitor Vitals, Handover & Log",
      action: "Keep the casualty warm, monitor breathing until paramedics arrive, and record time and actions in the audit ledger.",
      tip: "Keep emergency eyewash and first-aid kit restocked after every incident.",
    },
  ];

  const activeSteps =
    mode === "pass" ? PASS_STEPS : mode === "spill" ? SPILL_STEPS : FIRST_AID_STEPS;
  const maxStep = activeSteps.length;
  const waterHazardActive = mode === "pass" && extinguisher === "water";
  const drillKey = `3d-${mode}`;
  const isAlreadySigned = !!completedDrills[drillKey];

  // Auto-check optional trainer video when collapsible Live Trainer Demo opens
  useEffect(() => {
    if (!trainerOpen) return;
    let cancelled = false;
    setLocalVideoFound("checking");
    setVideoLoadErr(false);
    fetch("/training-assets/shell-fire-drill.mp4", { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setLocalVideoFound(res.ok ? "available" : "missing");
      })
      .catch(() => {
        if (!cancelled) setLocalVideoFound("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [trainerOpen]);

  const switchMode = (nextMode: Drill3DMode) => {
    setMode(nextMode);
    setStep(0);
    setSignedNotice(null);
  };

  const speakCurrentStep = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const idx = Math.min(step, maxStep - 1);
    const meta = activeSteps[idx];
    const text = waterHazardActive
      ? "Safety warning! Never use a water extinguisher on a Class B fuel fire. Water causes violent boil-over and spreads burning petrol. Switch to 9 kilogram Dry Chemical Powder or CO2."
      : `${meta.title}. ${meta.action}`;

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const { voice } = pickBestVoice(settings.lang, window.speechSynthesis.getVoices());
    if (voice) {
      utter.voice = voice;
      utter.lang = voice.lang;
    }
    utter.rate = settings.voiceRate ?? 1.0;
    window.speechSynthesis.speak(utter);
  };

  const recordCompletion = () => {
    mutate((s) => ({
      ...s,
      completedDrills: { ...s.completedDrills, [drillKey]: true },
      ledger: appendLedger(
        s.ledger,
        s.settings.role,
        "DRILL_3D_COMPLETED",
        `Completed 3D Forecourt Drill: ${mode.toUpperCase()} (${maxStep}/${maxStep} steps)`,
        { drillKey, mode, extinguisher: mode === "pass" ? extinguisher : null, country: s.settings.country }
      ),
    }));
    setSignedNotice(`3D ${mode.toUpperCase()} drill signed & hashed to ledger.`);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Interactive 3D Forecourt Staff Training Lab"
        sub="100% procedural offline WebGL simulation — zero heavy downloads, instant on POS terminals, tablets & phones."
      />

      {/* 3D Drill Mode Switcher */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" role="tablist" aria-label="3D Forecourt Drills">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "pass"}
          onClick={() => switchMode("pass")}
          className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-colors ${
            mode === "pass"
              ? "border-amber-400 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
          }`}
        >
          <Flame size={18} aria-hidden="true" />
          1. P.A.S.S. Fire Drill
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "spill"}
          onClick={() => switchMode("spill")}
          className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-colors ${
            mode === "spill"
              ? "border-amber-400 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
          }`}
        >
          <Droplets size={18} aria-hidden="true" />
          2. Fuel Spill Response
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={mode === "firstaid"}
          onClick={() => switchMode("firstaid")}
          className={`flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-black transition-colors ${
            mode === "firstaid"
              ? "border-amber-400 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
          }`}
        >
          <HeartPulse size={18} aria-hidden="true" />
          3. First Aid Awareness
        </button>
      </div>

      {/* Mode 1 Extinguisher Selector & Class B Warning */}
      {mode === "pass" ? (
        <Card title="Extinguisher Selection & Wind Position">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                { id: "dcp", label: "9kg DCP (Recommended Class B)" },
                { id: "co2", label: "CO2 (Class B / Electrical)" },
                { id: "water", label: "Water (Class A Only)" },
              ] as { id: ExtinguisherKind; label: string }[]
            ).map((opt) => {
              const active = extinguisher === opt.id;
              const isDanger = opt.id === "water";
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setExtinguisher(opt.id);
                    if (opt.id === "water") setStep(0);
                  }}
                  className={`min-h-[48px] rounded-xl border px-3 py-2 text-xs font-extrabold transition-colors sm:text-sm ${
                    active && isDanger
                      ? "border-red-400 bg-red-600 text-white"
                      : active
                      ? "border-emerald-400 bg-emerald-600 text-white"
                      : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {waterHazardActive ? (
            <div className="mt-3">
              <Alert tone="danger">
                <span className="flex items-start gap-2">
                  <AlertTriangle size={22} aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" />
                  <span>
                    <strong className="block">CLASS B FUEL HAZARD — DO NOT USE WATER!</strong>
                    Water sinks beneath petrol/diesel and flashes into steam, violently spraying burning fuel across the forecourt. Switch to 9kg DCP or CO2 to begin the P.A.S.S. drill.
                  </span>
                </span>
              </Alert>
            </div>
          ) : null}
        </Card>
      ) : null}

      {/* 3D Viewport */}
      <Card>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Box size={18} aria-hidden="true" className="text-sky-400" />
            <span className="text-sm font-extrabold text-slate-100">
              Drag to orbit · Scroll/pinch to zoom · Step {step}/{maxStep}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={speakCurrentStep}
              className="btn-ghost min-h-[40px] px-3 py-1 text-xs font-bold"
            >
              <Volume2 size={15} aria-hidden="true" className="text-amber-400" />
              Speak Step
            </button>
            <button
              type="button"
              onClick={() => setResetToken((x) => x + 1)}
              className="btn-ghost min-h-[40px] px-3 py-1 text-xs font-bold"
            >
              <RotateCcw size={15} aria-hidden="true" />
              Reset Camera
            </button>
          </div>
        </div>

        <Forecourt3DCanvas
          mode={mode}
          step={step}
          extinguisher={extinguisher}
          waterHazardActive={waterHazardActive}
          resetToken={resetToken}
        />

        {/* Step Controls */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setStep(0)}
          >
            <RotateCcw size={18} aria-hidden="true" />
            Reset Drill
          </button>

          <div className="flex flex-1 justify-end gap-2">
            <button
              type="button"
              className="btn-accent flex-1 sm:flex-none sm:px-6"
              disabled={waterHazardActive || step >= maxStep}
              onClick={() => setStep((s) => Math.min(maxStep, s + 1))}
            >
              {step === 0
                ? `Start Step 1: ${activeSteps[0].title.replace(/^\d+\.\s*/, "")}`
                : step < maxStep
                ? `Execute Step ${step + 1}: ${activeSteps[step].title.replace(/^\d+\.\s*/, "")}`
                : "Drill Complete ✓"}
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </Card>

      {/* Interactive Step Cards */}
      <Card title="Step-by-Step Procedure">
        <div className="space-y-2">
          {activeSteps.map((st, idx) => {
            const stepNum = idx + 1;
            const completed = step >= stepNum;
            const isNext = !waterHazardActive && step + 1 === stepNum;
            return (
              <button
                key={st.title}
                type="button"
                disabled={waterHazardActive}
                onClick={() => setStep(stepNum)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  completed
                    ? "border-emerald-500/60 bg-emerald-950/45 text-emerald-100"
                    : isNext
                    ? "border-amber-400 bg-amber-950/35 text-amber-50"
                    : "border-slate-700 bg-[#0b1329] text-slate-200 hover:border-slate-500"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-extrabold">{st.title}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-black uppercase ${
                      completed
                        ? "bg-emerald-500/20 text-emerald-300"
                        : isNext
                        ? "bg-amber-500 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {completed ? "Done" : isNext ? "Next" : "Pending"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{st.action}</p>
                <p className="mt-1 text-xs text-sky-300">Tip: {st.tip}</p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Collapsible Live Trainer Demo (Mode 1 or anytime) */}
      <Card>
        <button
          type="button"
          onClick={() => setTrainerOpen((v) => !v)}
          aria-expanded={trainerOpen}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="flex items-center gap-2 text-lg font-extrabold text-ink">
            <Play size={18} aria-hidden="true" className="text-amber-400" />
            Live Trainer Demo (Optional Video Asset)
          </span>
          <span className="rounded-lg border border-slate-700 bg-[#0b1329] px-2.5 py-1 text-xs font-bold text-slate-300">
            {trainerOpen ? "Hide" : "Expand"}
          </span>
        </button>

        {trainerOpen ? (
          <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
            {localVideoFound === "checking" ? (
              <p className="text-sm text-muted">Checking /training-assets/shell-fire-drill.mp4…</p>
            ) : localVideoFound === "available" && !videoLoadErr ? (
              <video
                controls
                playsInline
                preload="metadata"
                src="/training-assets/shell-fire-drill.mp4"
                onError={() => setVideoLoadErr(true)}
                className="max-h-[360px] w-full rounded-xl border border-slate-700 bg-black"
              >
                Your browser does not support HTML5 video.
              </video>
            ) : (
              <Alert tone="info">
                <p className="font-bold text-slate-100">
                  No local file detected at <code className="text-amber-300">public/training-assets/shell-fire-drill.mp4</code>.
                </p>
                <p className="mt-1 text-sm font-normal text-slate-300">
                  To bundle a site-specific live fire-drill clip offline, copy your MP4 to{" "}
                  <code className="text-amber-300">public/training-assets/shell-fire-drill.mp4</code>. Meanwhile, you can play the built-in 2-Minute Executive Demo anytime.
                </p>
                <button
                  type="button"
                  onClick={openDemo}
                  className="btn-accent mt-2 text-sm"
                >
                  <Play size={16} aria-hidden="true" />
                  Watch 2-Min Executive Demo
                </button>
              </Alert>
            )}
          </div>
        ) : null}
      </Card>

      {/* SHA-256 Completion Sign-off */}
      <Card>
        {isAlreadySigned ? (
          <Alert tone="ok">
            <CheckCircle2 size={18} aria-hidden="true" className="mr-1.5 inline" />
            3D {mode.toUpperCase()} Drill Completion recorded &amp; sealed in the SHA-256 audit ledger.
          </Alert>
        ) : (
          <button
            type="button"
            className="btn w-full"
            disabled={step < maxStep || waterHazardActive}
            onClick={recordCompletion}
          >
            <ShieldCheck size={20} aria-hidden="true" />
            Record 3D Drill Completion to SHA-256 Ledger
          </button>
        )}
        {signedNotice ? (
          <div className="mt-2">
            <Alert tone="ok">{signedNotice}</Alert>
          </div>
        ) : null}
      </Card>

      <AwarenessCertificateCard moduleTitle="3D Forecourt Fire, Spill & First Aid Simulation" />
    </div>
  );
}

