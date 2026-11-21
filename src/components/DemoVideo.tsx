"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";

const OPEN_EVENT = "ssc-open-demo";
export const DEMO_SRC = "/demo/service-station-2min-demo.mp4";

/** Opens the demo modal from anywhere (header, dashboard, etc.). */
export function openDemo() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function DemoButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={openDemo}
      aria-label="Watch 2-Min Executive Demo"
      className={`inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#D97706] bg-[#064E3B] font-extrabold text-white ${
        compact ? "px-3 text-sm" : "w-full px-4 text-lg"
      }`}
    >
      <Play size={compact ? 18 : 22} aria-hidden="true" className="fill-[#D97706] text-[#D97706]" />
      {compact ? <span className="hidden sm:inline">Demo</span> : "Watch 2-Min Executive Demo"}
    </button>
  );
}

export default function DemoModal() {
  const [open, setOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const close = useCallback(() => {
    videoRef.current?.pause();
    setOpen(false);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="2-Minute Executive Demo"
        className="w-full max-w-3xl rounded-2xl border-2 border-[#D97706] bg-[#0F172A] p-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-white">2-Minute Executive Demo</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close demo"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#D97706] text-[#0F172A]"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>
        <video
          ref={videoRef}
          src={DEMO_SRC}
          controls
          playsInline
          preload="metadata"
          autoPlay
          className="max-h-[75vh] w-full rounded-xl bg-black"
        >
          Your browser does not support HTML5 video.
        </video>
      </div>
    </div>
  );
}
