"use client";

import { useEffect, useState, type DragEvent } from "react";
import {
  Building2,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  FileUp,
  Globe2,
  Layers,
  Network,
  Save,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  DEMO_MULTI_SITE_NETWORK,
  parseSitelistInput,
  SAMPLE_SITELIST_CSV,
  SAMPLE_SITELIST_JSON,
} from "@/lib/sitePlugin";
import { CURRENCY_BY_COUNTRY, STATUTORY } from "@/lib/statutory";
import { Alert, NumberField } from "@/components/ui";
import type { Country } from "@/lib/types";

const PRIMARY_COUNTRIES: Country[] = [
  "Kenya",
  "Tanzania",
  "Ghana",
  "South Africa",
  "Uganda",
  "Rwanda",
];

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function SiteSetupBulkImportPanel({ compact = false }: { compact?: boolean }) {
  const {
    state,
    updateActiveSiteProfile,
    switchSite,
    importSites,
    removeSite,
  } = useStore();
  const { settings, sites, activeSiteId } = state;

  const [tab, setTab] = useState<"single" | "bulk">("single");

  // Single-Site Quick Setup form state synced with active site
  const [siteName, setSiteName] = useState(settings.stationName);
  const [brandNetwork, setBrandNetwork] = useState(settings.brandNetwork);
  const [siteCode, setSiteCode] = useState(settings.siteCode);
  const [country, setCountry] = useState<Country>(settings.country);
  const [physicalAddress, setPhysicalAddress] = useState(settings.physicalAddress);
  const [section162Manager, setSection162Manager] = useState(settings.section162Manager);
  const [emergencyContact, setEmergencyContact] = useState(settings.emergencyContact);
  const [tankCount, setTankCount] = useState<number>(settings.tankCount || 3);
  const [dispenserCount, setDispenserCount] = useState<number>(settings.dispenserCount || 4);
  const [singleNotice, setSingleNotice] = useState<string | null>(null);

  // Multi-Site Sitelist Plugin state
  const [sitelistRaw, setSitelistRaw] = useState<string>(SAMPLE_SITELIST_CSV);
  const [dragOver, setDragOver] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{
    ok: boolean;
    message: string;
    details?: string[];
  } | null>(null);

  useEffect(() => {
    setSiteName(settings.stationName);
    setBrandNetwork(settings.brandNetwork);
    setSiteCode(settings.siteCode);
    setCountry(settings.country);
    setPhysicalAddress(settings.physicalAddress);
    setSection162Manager(settings.section162Manager);
    setEmergencyContact(settings.emergencyContact);
    setTankCount(settings.tankCount || 3);
    setDispenserCount(settings.dispenserCount || 4);
  }, [
    activeSiteId,
    settings.stationName,
    settings.brandNetwork,
    settings.siteCode,
    settings.country,
    settings.physicalAddress,
    settings.section162Manager,
    settings.emergencyContact,
    settings.tankCount,
    settings.dispenserCount,
  ]);

  const handleSaveSingle = () => {
    const cleanName = siteName.trim() || "Service Station Site";
    const cleanBrand = brandNetwork.trim() || "Independent Retail Forecourt";
    const cleanCode = siteCode.trim() || "SITE-01";
    const cleanAddr = physicalAddress.trim() || `${cleanName} Precinct`;
    const cleanMgr = section162Manager.trim() || "16(2) Assigned Manager";
    const cleanEmg = emergencyContact.trim() || "112 / Regional EMS & Fire";
    const safeTanks = Math.min(12, Math.max(1, Math.round(tankCount || 1)));
    const safeDispensers = Math.min(24, Math.max(1, Math.round(dispenserCount || 1)));

    updateActiveSiteProfile({
      siteName: cleanName,
      brandNetwork: cleanBrand,
      siteCode: cleanCode,
      country,
      currency: CURRENCY_BY_COUNTRY[country],
      physicalAddress: cleanAddr,
      section162Manager: cleanMgr,
      emergencyContact: cleanEmg,
      tankCount: safeTanks,
      dispenserCount: safeDispensers,
    });

    setSingleNotice(
      `Updated "${cleanName}" (${cleanCode} · ${country}) — OHS checklists, wetstock headers, emergency SOPs, and awareness certificates across the app now reflect this station.`
    );
  };

  const applySitelistText = (raw: string, mode: "replace" | "merge") => {
    const parsed = parseSitelistInput(raw);
    if (!parsed.ok) {
      setBulkFeedback({
        ok: false,
        message: parsed.errors.join(" · "),
      });
      return;
    }

    importSites(parsed.sites, mode);
    const countries = Array.from(new Set(parsed.sites.map((s) => s.country))).join(", ");
    setBulkFeedback({
      ok: true,
      message: `Loaded ${parsed.sites.length} site(s) across [${countries}] in "${mode}" mode. Header Site Switcher updated and persisted locally.`,
      details: parsed.warnings.length > 0 ? parsed.warnings : undefined,
    });
  };

  const loadDemoNetwork = () => {
    setSitelistRaw(SAMPLE_SITELIST_CSV);
    importSites(DEMO_MULTI_SITE_NETWORK, "replace");
    setBulkFeedback({
      ok: true,
      message: `Demo Multi-Site Network (${DEMO_MULTI_SITE_NETWORK.length} sites across Kenya, Tanzania, Ghana & South Africa) loaded into the Site Switcher.`,
    });
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    setSitelistRaw(text);
    applySitelistText(text, "replace");
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void handleFile(file);
    }
  };

  return (
    <section className="card border-slate-700 bg-slate-900/95">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-50 sm:text-xl">
            <Building2 size={20} aria-hidden="true" className="text-amber-400" />
            Site Setup &amp; Multi-Site Bulk Import
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            White-label site configuration: onboard one forecourt in 30 seconds or bulk-feed a
            retailer CSV/JSON sitelist into the header Site Switcher.
          </p>
        </div>
        <span className="rounded-lg border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1 font-mono text-xs font-bold text-emerald-300">
          {sites.length} {sites.length === 1 ? "site" : "sites"} in network
        </span>
      </div>

      {/* Mode Switcher */}
      <div
        className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2"
        role="tablist"
        aria-label="Site configuration mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "single"}
          onClick={() => setTab("single")}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors ${
            tab === "single"
              ? "border-amber-400 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-500"
          }`}
        >
          <Building2 size={17} aria-hidden="true" />
          Single-Site Quick Setup
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === "bulk"}
          onClick={() => setTab("bulk")}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-extrabold transition-colors ${
            tab === "bulk"
              ? "border-amber-400 bg-amber-500 text-slate-950"
              : "border-slate-700 bg-slate-950/70 text-slate-200 hover:border-slate-500"
          }`}
        >
          <Network size={17} aria-hidden="true" />
          Multi-Site Sitelist Plugin (CSV / JSON)
        </button>
      </div>

      {tab === "single" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Station Name</span>
              <input
                className="field"
                value={siteName}
                onChange={(e) => {
                  setSiteName(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="e.g. Highway Junction Service Station"
              />
            </label>

            <label className="block">
              <span className="label">Brand / Independent Label</span>
              <input
                className="field"
                value={brandNetwork}
                onChange={(e) => {
                  setBrandNetwork(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="e.g. Independent Retail / Savanna Fuels"
              />
            </label>

            <label className="block">
              <span className="label">Site Code</span>
              <input
                className="field font-mono"
                value={siteCode}
                onChange={(e) => {
                  setSiteCode(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="e.g. KE-NBO-01"
              />
            </label>

            <label className="block">
              <span className="label">Country / Regulatory Region</span>
              <select
                className="field"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value as Country);
                  setSingleNotice(null);
                }}
              >
                {PRIMARY_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({CURRENCY_BY_COUNTRY[c]} · {STATUTORY[c].energy})
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="label">Physical Address</span>
              <input
                className="field"
                value={physicalAddress}
                onChange={(e) => {
                  setPhysicalAddress(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="Plot / Road / Town / Municipality"
              />
            </label>

            <label className="block">
              <span className="label">Section 16(2) Manager Name</span>
              <input
                className="field"
                value={section162Manager}
                onChange={(e) => {
                  setSection162Manager(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="Assigned Site Manager"
              />
            </label>

            <label className="block">
              <span className="label">Primary Emergency Contact</span>
              <input
                className="field"
                value={emergencyContact}
                onChange={(e) => {
                  setEmergencyContact(e.target.value);
                  setSingleNotice(null);
                }}
                placeholder="e.g. 999 / 112 (Regional Fire & EMS)"
              />
            </label>

            <NumberField
              label="Underground Tank Count (1–12)"
              value={tankCount}
              min={1}
              step="1"
              onChange={(v) => {
                setTankCount(v);
                setSingleNotice(null);
              }}
            />

            <NumberField
              label="Dispenser / Nozzle Count (1–24)"
              value={dispenserCount}
              min={1}
              step="1"
              onChange={(v) => {
                setDispenserCount(v);
                setSingleNotice(null);
              }}
            />
          </div>

          {/* Live Dynamic Token Strip */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/80 p-3">
            <p className="mb-1.5 text-xs font-extrabold uppercase tracking-wide text-sky-400">
              Live Template Hydration Preview
            </p>
            <div className="flex flex-wrap gap-1.5 font-mono text-xs">
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
                {"{{SITE_NAME}}"} = {siteName || "—"}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
                {"{{BRAND_NETWORK}}"} = {brandNetwork || "—"}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
                {"{{SITE_CODE}}"} = {siteCode || "—"}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
                {"{{SECTION_16_2_MANAGER}}"} = {section162Manager || "—"}
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200">
                {"{{TANK_COUNT}}"} = {Math.max(1, tankCount || 1)}
              </span>
            </div>
          </div>

          <button type="button" className="btn-accent w-full" onClick={handleSaveSingle}>
            <Save size={18} aria-hidden="true" />
            Save &amp; Update All Site Templates
          </button>

          {singleNotice ? (
            <Alert tone="ok">
              <CheckCircle2 size={18} aria-hidden="true" className="mr-1.5 inline" />
              {singleNotice}
            </Alert>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              type="button"
              className="btn-ghost text-xs sm:text-sm"
              onClick={() =>
                downloadFile(
                  "retail-sitelist-sample.csv",
                  SAMPLE_SITELIST_CSV,
                  "text/csv;charset=utf-8"
                )
              }
            >
              <Download size={16} aria-hidden="true" className="text-emerald-400" />
              Download Sample Sitelist CSV
            </button>

            <button
              type="button"
              className="btn-accent text-xs sm:text-sm"
              onClick={loadDemoNetwork}
            >
              <Globe2 size={16} aria-hidden="true" />
              Load Demo Multi-Site Network
            </button>

            <button
              type="button"
              className="btn-ghost text-xs sm:text-sm"
              onClick={() => {
                setSitelistRaw(SAMPLE_SITELIST_JSON);
                setBulkFeedback(null);
              }}
            >
              <FileJson size={16} aria-hidden="true" className="text-amber-400" />
              Paste Sample JSON
            </button>
          </div>

          {/* Drag & Drop Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
              dragOver
                ? "border-amber-400 bg-amber-950/30"
                : "border-slate-700 bg-slate-950/60"
            }`}
          >
            <FileUp size={24} aria-hidden="true" className="mx-auto mb-1 text-amber-400" />
            <p className="text-sm font-bold text-slate-100">
              Drag &amp; drop a retailer sitelist (.CSV or .JSON) here
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              Columns: site_name, brand_network, site_code, physical_address, country,
              section_16_2_manager, emergency_contact, tank_count, dispenser_count
            </p>
            <label className="btn-ghost mt-3 inline-flex cursor-pointer text-xs sm:text-sm">
              <FileSpreadsheet size={16} aria-hidden="true" />
              Browse .CSV / .JSON File
              <input
                type="file"
                accept=".csv,.json,text/csv,application/json"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>
          </div>

          {/* Paste CSV / JSON Feed */}
          <label className="block">
            <span className="label">Sitelist Feed (Paste CSV or JSON)</span>
            <textarea
              className={`field font-mono text-xs ${compact ? "min-h-[120px]" : "min-h-[155px]"}`}
              value={sitelistRaw}
              onChange={(e) => setSitelistRaw(e.target.value)}
              aria-label="Retailer multi-site CSV or JSON sitelist"
            />
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn w-full text-sm"
              onClick={() => applySitelistText(sitelistRaw, "replace")}
            >
              <Layers size={17} aria-hidden="true" />
              Import &amp; Replace Network
            </button>
            <button
              type="button"
              className="btn-ghost w-full text-sm"
              onClick={() => applySitelistText(sitelistRaw, "merge")}
            >
              <Network size={17} aria-hidden="true" />
              Merge Into Current Network
            </button>
          </div>

          {bulkFeedback ? (
            <Alert tone={bulkFeedback.ok ? "ok" : "danger"}>
              <p>{bulkFeedback.message}</p>
              {bulkFeedback.details?.length ? (
                <ul className="mt-1 list-disc pl-5 text-xs font-normal">
                  {bulkFeedback.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </Alert>
          ) : null}

          {/* Active Network Directory */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/70 p-3">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-amber-400">
              Active Network Directory ({sites.length} station{sites.length === 1 ? "" : "s"})
            </p>
            <ul className="space-y-2">
              {sites.map((site) => {
                const isActive = site.id === activeSiteId;
                return (
                  <li
                    key={site.id}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 ${
                      isActive
                        ? "border-amber-400/70 bg-amber-950/25"
                        : "border-slate-800 bg-slate-900/70"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-50">
                        <span className="mr-1.5 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-amber-300">
                          {site.siteCode}
                        </span>
                        {site.siteName}
                      </p>
                      <p className="truncate text-xs text-slate-300">
                        {site.brandNetwork} · {site.country} ({site.currency}) · {site.tankCount} tanks /{" "}
                        {site.dispenserCount} dispensers · Mgr: {site.section162Manager}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => switchSite(site.id)}
                        disabled={isActive}
                        className={`min-h-[38px] rounded-lg px-3 py-1 text-xs font-extrabold ${
                          isActive
                            ? "border border-emerald-500/50 bg-emerald-950/70 text-emerald-300"
                            : "border border-slate-700 bg-slate-800 text-slate-100 hover:border-amber-400"
                        }`}
                      >
                        {isActive ? "Active" : "Switch"}
                      </button>

                      {sites.length > 1 ? (
                        <button
                          type="button"
                          aria-label={`Remove ${site.siteName}`}
                          onClick={() => removeSite(site.id)}
                          className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}

