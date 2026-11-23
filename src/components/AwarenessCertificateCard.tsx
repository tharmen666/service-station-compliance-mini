"use client";

import { useMemo, useState } from "react";
import { Award, CheckCircle2, Download, Printer } from "lucide-react";
import { resolveOhsMasterTemplate } from "@/data/genericOhsMasterTemplate";
import { sha256Hex } from "@/lib/sha256";
import { siteSettingsToTemplateContext } from "@/lib/sitePlugin";
import { STATUTORY } from "@/lib/statutory";
import { useStore } from "@/lib/store";

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function AwarenessCertificateCard({
  moduleTitle = "Forecourt Safety, Wetstock & OHS Rollout Awareness",
}: {
  moduleTitle?: string;
}) {
  const { state } = useStore();
  const { settings, completedDrills, trainingSignoffs } = state;

  const [traineeName, setTraineeName] = useState("Forecourt Attendant / Staff Member");
  const [employeeId, setEmployeeId] = useState("STAFF-001");

  const hydrated = useMemo(
    () => resolveOhsMasterTemplate(siteSettingsToTemplateContext(settings)),
    [settings]
  );
  const cert = hydrated.trainingAndInduction.certificateTemplate;
  const statutory = STATUTORY[settings.country];

  const completedDrillNames = Object.entries(completedDrills)
    .filter(([, done]) => done)
    .map(([k]) => k.replace(/^3d-/, "3D ").toUpperCase());

  const cleanTrainee = traineeName.trim() || "Forecourt Attendant / Staff Member";
  const cleanEmpId = employeeId.trim() || "STAFF-001";
  const issueDate = new Date().toISOString().slice(0, 10);

  const certHash = sha256Hex(
    `${settings.siteCode}|${settings.stationName}|${settings.section162Manager}|${cleanTrainee}|${cleanEmpId}|${moduleTitle}`
  ).slice(0, 16).toUpperCase();

  const downloadHtmlCertificate = () => {
    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(cert.heading)} — ${escapeHtml(settings.siteCode)}</title>
<style>
  body { font-family: Arial, sans-serif; background: #0f172a; color: #0f172a; padding: 32px; }
  .sheet { max-width: 820px; margin: 0 auto; background: #ffffff; border: 6px double #0b3a6f; padding: 36px; border-radius: 10px; }
  .brand { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #1f6fbf; font-weight: bold; }
  h1 { color: #0b3a6f; font-size: 26px; margin: 10px 0 4px; }
  .sub { color: #475569; font-size: 14px; margin-bottom: 24px; }
  .trainee { font-size: 24px; font-weight: bold; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin: 16px 0; }
  .box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 6px; margin: 16px 0; font-size: 14px; line-height: 1.5; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 24px; font-size: 13px; }
  .sig { border-top: 1px solid #334155; padding-top: 8px; margin-top: 28px; }
  .foot { margin-top: 22px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
</style>
</head>
<body>
  <div class="sheet">
    <div class="brand">${escapeHtml(cert.subheading)}</div>
    <h1>${escapeHtml(cert.heading)}</h1>
    <div class="sub">Module: ${escapeHtml(moduleTitle)}</div>
    <p>Presented to:</p>
    <div class="trainee">${escapeHtml(cleanTrainee)} (${escapeHtml(cleanEmpId)})</div>
    <div class="box">
      <p>${escapeHtml(cert.statement)}</p>
      <p><strong>Site:</strong> ${escapeHtml(settings.stationName)} (${escapeHtml(settings.siteCode)})<br/>
      <strong>Address:</strong> ${escapeHtml(settings.physicalAddress)}<br/>
      <strong>Statutory Alignment:</strong> ${escapeHtml(statutory.ohs)} · ${escapeHtml(statutory.energy)} · ${escapeHtml(statutory.standards)}</p>
    </div>
    <div class="grid">
      <div class="sig">
        <strong>${escapeHtml(cert.authorizedByLabel)}</strong><br/>
        Issue Date: ${escapeHtml(issueDate)}
      </div>
      <div class="sig">
        <strong>Certificate Verification Seal</strong><br/>
        SHA-256 Ref: ${escapeHtml(certHash)}
      </div>
    </div>
    <div class="foot">${escapeHtml(cert.regulatoryBasis)}<br/>${escapeHtml(cert.footerNote)}</div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ohs-awareness-certificate-${settings.siteCode.toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card border-amber-500/40 bg-slate-900/95">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-amber-300 sm:text-xl">
            <Award size={20} aria-hidden="true" />
            Dynamic OHS &amp; Forecourt Awareness Certificate
          </h2>
          <p className="mt-0.5 text-xs text-slate-300 sm:text-sm">
            Hydrated live from active station profile ({settings.siteCode} · {settings.stationName}).
          </p>
        </div>
        <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 font-mono text-xs text-emerald-300">
          SEAL {certHash}
        </span>
      </div>

      {/* Trainee details */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="block">
          <span className="label text-xs">Recipient Full Name</span>
          <input
            className="field text-sm"
            value={traineeName}
            onChange={(e) => setTraineeName(e.target.value)}
            placeholder="Enter attendant / staff name"
          />
        </label>
        <label className="block">
          <span className="label text-xs">Employee / Badge ID</span>
          <input
            className="field font-mono text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g. STAFF-001"
          />
        </label>
      </div>

      {/* Rendered Certificate Frame */}
      <div className="rounded-2xl border-2 border-amber-400/60 bg-slate-950 p-4 text-slate-100">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-sky-400">
          {cert.subheading}
        </p>
        <h3 className="mt-1 text-lg font-black text-white sm:text-xl">{cert.heading}</h3>
        <p className="text-xs font-bold text-amber-300">{moduleTitle}</p>

        <div className="mt-3 border-y border-slate-800 py-2.5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Awarded To</p>
          <p className="text-lg font-black text-emerald-300">
            {cleanTrainee}{" "}
            <span className="font-mono text-sm font-bold text-slate-400">({cleanEmpId})</span>
          </p>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-slate-200">{cert.statement}</p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
            OHS: {statutory.ohs}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
            Energy: {statutory.energy}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
            Standards: {statutory.standards}
          </span>
          {trainingSignoffs.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2 py-1 text-emerald-300">
              <CheckCircle2 size={12} aria-hidden="true" />
              Deck Signed ({trainingSignoffs.length})
            </span>
          ) : null}
          {completedDrillNames.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-950/60 px-2 py-1 text-emerald-300"
            >
              <CheckCircle2 size={12} aria-hidden="true" />
              {d}
            </span>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-800 pt-3 text-xs text-slate-300 sm:grid-cols-2">
          <div>
            <p className="font-bold text-white">{cert.authorizedByLabel}</p>
            <p className="text-slate-400">Issued: {issueDate}</p>
          </div>
          <div className="sm:text-right">
            <p className="font-mono font-bold text-amber-300">SHA-256 Ref: {certHash}</p>
            <p className="text-slate-400">{cert.regulatoryBasis}</p>
          </div>
        </div>

        <p className="mt-2 text-[11px] text-slate-400">{cert.footerNote}</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button type="button" className="btn-accent text-sm" onClick={downloadHtmlCertificate}>
          <Download size={16} aria-hidden="true" />
          Download Certificate (.HTML)
        </button>
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => window.print()}
        >
          <Printer size={16} aria-hidden="true" />
          Print Certificate
        </button>
      </div>
    </section>
  );
}

