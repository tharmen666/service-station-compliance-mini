"use client";

import { useEffect, useMemo, useState } from "react";
import { Square, Volume2 } from "lucide-react";
import type { ShiftRecon } from "@/lib/calc";
import { LANGS } from "@/lib/i18n";
import { useStore } from "@/lib/store";
import type { Lang } from "@/lib/types";
import { buildShiftBriefingScript, pickBestVoice } from "@/lib/voiceBriefing";

interface Props {
  shiftId: string;
  stationName: string;
  recon: ShiftRecon;
}

export function VoiceBriefingBar({ shiftId, stationName, recon }: Props) {
  const { state, mutate } = useStore();
  const lang = state.settings.lang;
  const rate = state.settings.voiceRate ?? 1.0;

  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const loadVoices = () => {
      try {
        setVoices(window.speechSynthesis.getVoices());
      } catch {
        setVoices([]);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  const matched = useMemo(() => pickBestVoice(lang, voices), [lang, voices]);

  const setLang = (code: Lang) =>
    mutate((s) => ({ ...s, settings: { ...s.settings, lang: code } }));

  const setRate = (nextRate: number) =>
    mutate((s) => ({ ...s, settings: { ...s.settings, voiceRate: nextRate } }));

  const toggleSpeak = () => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const script = buildShiftBriefingScript({
      lang,
      stationName,
      shiftId,
      recon,
    });
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(script);
    if (matched.voice) {
      utter.voice = matched.voice;
      utter.lang = matched.voice.lang;
    } else {
      utter.lang = lang;
    }
    utter.rate = rate;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <section className="card border-slate-700 bg-slate-900/95">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="block sm:col-span-2">
            <span className="label text-xs uppercase tracking-wide text-slate-300">
              Regional Voice &amp; Language (KE · TZ · GH · ZA)
            </span>
            <select
              className="field text-sm"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label text-xs uppercase tracking-wide text-slate-300">
              Speech Rate
            </span>
            <select
              className="field text-sm"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            >
              <option value={0.85}>0.85x (Clear)</option>
              <option value={1}>1.0x (Standard)</option>
              <option value={1.15}>1.15x (Fast)</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          className={speaking ? "btn bg-red-600 text-white sm:w-auto" : "btn-accent sm:w-auto"}
          disabled={!supported}
          onClick={toggleSpeak}
        >
          {speaking ? (
            <>
              <Square size={18} aria-hidden="true" />
              Stop Briefing
            </>
          ) : (
            <>
              <Volume2 size={18} aria-hidden="true" />
              Speak Shift Briefing
            </>
          )}
        </button>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {supported
          ? `Voice match: ${matched.matchedLabel}`
          : "Web Speech API voice-over unavailable in this browser environment."}
      </p>
    </section>
  );
}

