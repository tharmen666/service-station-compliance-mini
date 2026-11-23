"use client";

import { useState } from "react";
import { Download, Upload, Send } from "lucide-react";
import { useStore } from "@/lib/store";
import { appendLedger } from "@/lib/ledger";
import { IntegrationHubPanel } from "@/components/IntegrationHubPanel";
import { SiteSetupBulkImportPanel } from "@/components/SiteSetupBulkImportPanel";
import { fmt, Alert, Card, PageHeader, useT, FOOTER_TEXT } from "@/components/ui";
import type { Ticket } from "@/lib/types";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ConnectorsPage() {
  const { state, mutate } = useStore();
  const { t } = useT();
  const [csvRows, setCsvRows] = useState<{ tankId: string; closingL: number; date: string }[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [omisMsg, setOmisMsg] = useState<string | null>(null);

  const siteCode = state.settings.siteCode || "SITE-01";
  const siteTitanExample = {
    stationId: siteCode,
    date: "2026-11-18",
    readings: [
      { tankId: "T1", closingL: 26880, waterCm: 0 },
      { tankId: "T2", closingL: 16205, waterCm: 0 },
    ],
  };
  const siteOmnicommExample = {
    stationId: siteCode,
    waybillNo: "WB-44021",
    tankId: "T1",
    dispatchL: 10000,
    gpsArrivalIso: "2026-11-18T06:42:00Z",
  };
  const siteOmisExample = {
    stationId: siteCode,
    ticketType: "WETSTOCK_VARIANCE",
    severity: "HIGH",
    asset: state.tanks[0]?.name ?? "Tank 1",
    detail: `Variance 42 L exceeds volumetric tolerance on closed shift (${state.settings.stationName})`,
    raisedAt: "2026-11-18T18:05:00Z",
  };

  const exportTemplate = () => {
    const rows = [
      ["tank_id", "product", "date", "closing_l", "water_cm", "dip_closing_l", "dipstick_type"],
      ...state.tanks.map((tk) => {
        const lastDip = [...state.dips].reverse().find((d) => d.tankId === tk.id);
        return [
          tk.id,
          tk.product,
          new Date().toISOString().slice(0, 10),
          "",
          "",
          lastDip ? lastDip.litres : "",
          lastDip ? (lastDip.dipstickType ?? "wooden") : "",
        ];
      }),
    ];
    const body = rows.map((r) => r.map(csvCell).join(",")).join("\n");
    download("service-station-atg-template.csv", `${body}\n# ${FOOTER_TEXT}\n`);
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
    const errs: string[] = [];
    const out: { tankId: string; closingL: number; date: string }[] = [];
    const header = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase());
    const idxT = header.indexOf("tank_id");
    const idxD = header.indexOf("date");
    const idxL = header.indexOf("closing_l");
    if (idxT < 0 || idxD < 0 || idxL < 0) errs.push("Header must include tank_id, date, closing_l");
    lines.slice(1).forEach((line, i) => {
      const c = line.split(",").map((x) => x.trim());
      const closingL = Number(c[idxL]);
      if (!c[idxT]) errs.push(`Row ${i + 2}: tank_id missing`);
      if (!Number.isFinite(closingL) || closingL < 0) errs.push(`Row ${i + 2}: closing_l must be a number >= 0`);
      else out.push({ tankId: c[idxT], closingL, date: c[idxD] });
    });
    setCsvErrors(errs);
    setCsvRows(out);
  };

  const raiseTicket = async () => {
    setOmisMsg(null);
    const openAlerts = state.shifts.filter((s) => s.status === "CLOSED");
    const detail = `Escalation from ${state.settings.stationName}: ${openAlerts.length} closed shift(s) reviewed`;
    const body = {
      stationId: siteCode,
      ticketType: "WETSTOCK_VARIANCE",
      severity: "HIGH",
      asset: state.tanks[0]?.name ?? "Tank",
      detail,
      raisedAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/v1/connectors/omis-4", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { status?: string; errors?: string[] };
      const status: Ticket["status"] =
        json.status === "forwarded" ? "FORWARDED" : json.status === "local_only" ? "LOCAL_ONLY" : "FAILED";
      const ticket: Ticket = {
        id: `TK-${Date.now().toString(36).toUpperCase()}`,
        ts: body.raisedAt,
        source: "WETSTOCK",
        severity: "HIGH",
        asset: body.asset,
        detail,
        status,
      };
      mutate((s) => ({
        ...s,
        tickets: [...s.tickets, ticket],
        ledger: appendLedger(s.ledger, s.settings.role, "OMIS_ESCALATION", `Ticket ${ticket.id} ${status}`, ticket),
      }));
      setOmisMsg(status === "LOCAL_ONLY" ? t("localOnly") : status);
    } catch {
      setOmisMsg("FAILED");
    }
  };

  const latestDip = (tankId: string) => [...state.dips].reverse().find((d) => d.tankId === tankId)?.litres ?? null;

  return (
    <div className="space-y-4">
      <PageHeader title={t("connectorsTitle")} sub={t("connectorsSub")} />

      <SiteSetupBulkImportPanel compact />

      <IntegrationHubPanel />

      <Card title={t("legacyMode")}>
        <p className="mb-3 text-base text-slate-200 sm:text-lg">{t("legacyBody")}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="btn-ghost" onClick={exportTemplate}>
            <Download size={20} aria-hidden="true" />
            {t("csvExport")}
          </button>
          <label className="btn-ghost cursor-pointer">
            <Upload size={20} aria-hidden="true" />
            {t("csvImport")}
            <input
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importCsv(f);
              }}
            />
          </label>
        </div>
        {csvErrors.length ? <div className="mt-3"><Alert tone="danger">{csvErrors.join("; ")}</Alert></div> : null}
        {csvRows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-base">
              <thead>
                <tr className="border-b border-slate-700 text-slate-300">
                  <th className="py-2">Tank</th>
                  <th>ATG (L)</th>
                  <th>{t("atgCheck")}</th>
                </tr>
              </thead>
              <tbody>
                {csvRows.map((r, i) => {
                  const dip = latestDip(r.tankId);
                  const pct = dip ? ((r.closingL - dip) / dip) * 100 : null;
                  return (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="py-2 font-bold">{r.tankId}</td>
                      <td>{fmt(r.closingL)}</td>
                      <td>{pct === null ? "—" : `${pct.toFixed(2)}%`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>

      <Card title={t("titanTitle")}>
        <p className="break-words text-base font-bold">
          {t("endpoint")}: <code className="break-all text-amber-300">POST /api/v1/connectors/titan-cloud</code>
        </p>
        <p className="mb-2 text-sm text-muted">Daily ATG closing volume (L) and water level, plus CSV importer above.</p>
        <pre className="max-w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-emerald-200">
          {JSON.stringify(siteTitanExample, null, 2)}
        </pre>
      </Card>

      <Card title={t("omnicommTitle")}>
        <p className="break-words text-base font-bold">
          {t("endpoint")}: <code className="break-all text-amber-300">POST /api/v1/connectors/omnicomm</code>
        </p>
        <p className="mb-2 text-sm text-muted">Inbound tanker dispatch volume (L) and GPS arrival, matched to pre- and post-drop dips.</p>
        <pre className="max-w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-emerald-200">
          {JSON.stringify(siteOmnicommExample, null, 2)}
        </pre>
      </Card>

      <Card title={t("omisTitle")}>
        <p className="break-words text-base font-bold">
          {t("endpoint")}: <code className="break-all text-amber-300">POST /api/v1/connectors/omis-4</code>
        </p>
        <p className="mb-2 text-sm text-muted">Raised automatically for pump meter drift, UST water ingress or unresolved variance.</p>
        <pre className="mb-3 max-w-full overflow-x-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-emerald-200">
          {JSON.stringify(siteOmisExample, null, 2)}
        </pre>
        <button type="button" className="btn w-full" onClick={raiseTicket}>
          <Send size={20} aria-hidden="true" />
          {t("escalate")}
        </button>
        {omisMsg ? (
          <div className="mt-3">
            <Alert tone={omisMsg === "FAILED" ? "danger" : "info"}>{omisMsg}</Alert>
          </div>
        ) : null}
        <h3 className="mt-4 text-lg font-extrabold">{t("ticketsTitle")}</h3>
        {state.tickets.length === 0 ? (
          <p className="text-muted">{t("noTickets")}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {state.tickets.map((tk) => (
              <li key={tk.id} className="rounded-lg border border-slate-700 bg-slate-950/70 p-2.5 text-base">
                <strong>{tk.id}</strong> · {tk.severity} · {tk.status} · {tk.detail}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
