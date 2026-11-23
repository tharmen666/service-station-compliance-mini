"use client";

import { useState } from "react";
import { Check, Code2, Copy, Download, FileSpreadsheet, FileUp, Layers } from "lucide-react";
import { useStore } from "@/lib/store";
import { computeShiftRecon } from "@/lib/calc";
import { appendLedger } from "@/lib/ledger";
import {
  buildErpCsv,
  buildShiftAuditJson,
  buildWebhookPayload,
  parseInboundPayload,
  SAMPLE_ATG_JSON,
  SAMPLE_CSV,
  SAMPLE_POS_JSON,
} from "@/lib/integrationPayloads";
import { Alert } from "@/components/ui";

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function IntegrationHubPanel({ compact = false }: { compact?: boolean }) {
  const { state, mutate } = useStore();
  const { settings, tanks, shifts, dips, ledger } = state;
  const activeShift = shifts.find((s) => s.status !== "CLOSED") ?? shifts[shifts.length - 1] ?? null;

  const [payloadInput, setPayloadInput] = useState<string>(SAMPLE_ATG_JSON);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showWebhookPreview, setShowWebhookPreview] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; lines: string[] } | null>(null);

  if (!activeShift) {
    return (
      <Alert tone="info">
        Open or create a shift first to export Shift Audit JSON, ERP CSV, or ingest POS/ATG telemetry.
      </Alert>
    );
  }

  const recon = computeShiftRecon(activeShift, tanks, settings, shifts, dips);
  const webhookJson = buildWebhookPayload(activeShift, recon, tanks, settings);

  const exportAuditJson = () => {
    const json = buildShiftAuditJson(activeShift, recon, tanks, settings, ledger);
    downloadText(`${activeShift.id.toLowerCase()}-audit.json`, json, "application/json;charset=utf-8");
  };

  const exportErpCsv = () => {
    const csv = buildErpCsv(activeShift, recon, tanks, settings);
    downloadText(`${activeShift.id.toLowerCase()}-erp-wetstock.csv`, csv, "text/csv;charset=utf-8");
  };

  const copyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookJson);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2500);
    } catch {
      setShowWebhookPreview(true);
    }
  };

  const applyPayload = (raw: string) => {
    const res = parseInboundPayload(raw, tanks, activeShift);
    if (!res.ok) {
      setImportFeedback({ ok: false, lines: res.errors });
      return;
    }
    mutate((s) => ({
      ...s,
      shifts: s.shifts.map((x) => (x.id === activeShift.id ? { ...x, ...res.patch } : x)),
      ledger: appendLedger(
        s.ledger,
        s.settings.role,
        "PAYLOAD_IMPORTED",
        `Ingested ${res.detectedMode} payload into shift ${activeShift.id} (${res.summary.length} field updates)`,
        { shiftId: activeShift.id, detectedMode: res.detectedMode, summary: res.summary }
      ),
    }));
    setImportFeedback({
      ok: true,
      lines: [`Applied in ${res.detectedMode} mode: ${res.summary.join(" · ")}`],
    });
  };

  const handleFileUpload = async (file: File) => {
    const text = await file.text();
    setPayloadInput(text);
    applyPayload(text);
  };

  return (
    <section className="card border-slate-700 bg-slate-900/95">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-50 sm:text-xl">
            <Layers size={20} aria-hidden="true" className="text-amber-400" />
            Plug-and-Play Integration Hub (IT &amp; ERP Connectors)
          </h2>
          <p className="mt-1 text-sm font-semibold text-emerald-300">
            Zero Rip-and-Replace: Plugs into existing POS, ATG, and ERP systems via CSV, JSON, or REST Webhooks.
          </p>
        </div>
        <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-xs text-slate-300">
          Target: {activeShift.id} ({recon.gaugingMode})
        </span>
      </div>

      {/* One-Click Exports & Webhook */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button type="button" className="btn-ghost text-sm" onClick={exportAuditJson}>
          <Download size={18} aria-hidden="true" className="text-amber-400" />
          Export Shift Audit JSON
        </button>
        <button type="button" className="btn-ghost text-sm" onClick={exportErpCsv}>
          <FileSpreadsheet size={18} aria-hidden="true" className="text-emerald-400" />
          Export ERP-Ready CSV
        </button>
        <button type="button" className="btn-accent text-sm" onClick={copyWebhook}>
          {copiedWebhook ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          {copiedWebhook ? "Webhook Copied" : "Copy Webhook Payload"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">
          Standardized schema ready for SAP, Prizm, Sage, Titan Cloud, or custom POS/ERP webhooks.
        </p>
        <button
          type="button"
          onClick={() => setShowWebhookPreview((v) => !v)}
          className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-bold text-slate-300 hover:border-amber-400"
        >
          <Code2 size={14} aria-hidden="true" />
          {showWebhookPreview ? "Hide Webhook JSON" : "Inspect Webhook JSON"}
        </button>
      </div>

      {showWebhookPreview ? (
        <pre className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-emerald-200">
          {webhookJson}
        </pre>
      ) : null}

      {/* Interactive POS / ATG Importer */}
      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-3">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-extrabold text-slate-100">
            Import POS / ATG Payload (JSON or CSV)
          </p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPayloadInput(SAMPLE_ATG_JSON)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-amber-400"
            >
              Sample ATG JSON
            </button>
            <button
              type="button"
              onClick={() => setPayloadInput(SAMPLE_POS_JSON)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-amber-400"
            >
              Sample POS JSON
            </button>
            <button
              type="button"
              onClick={() => setPayloadInput(SAMPLE_CSV)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-200 hover:border-amber-400"
            >
              Sample CSV
            </button>
          </div>
        </div>

        <textarea
          className={`field font-mono text-xs sm:text-sm ${compact ? "min-h-[120px]" : "min-h-[150px]"}`}
          value={payloadInput}
          onChange={(e) => setPayloadInput(e.target.value)}
          aria-label="POS or ATG JSON/CSV payload"
        />

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button type="button" className="btn w-full" onClick={() => applyPayload(payloadInput)}>
            Apply Payload to Active Shift
          </button>
          <label className="btn-ghost w-full cursor-pointer">
            <FileUp size={18} aria-hidden="true" />
            Upload .JSON / .CSV File
            <input
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>

        {importFeedback ? (
          <div className="mt-2">
            <Alert tone={importFeedback.ok ? "ok" : "danger"}>
              {importFeedback.lines.join(" · ")}
            </Alert>
          </div>
        ) : null}
      </div>
    </section>
  );
}

