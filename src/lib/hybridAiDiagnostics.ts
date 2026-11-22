import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import {
  getAI,
  getGenerativeModel,
  GoogleAIBackend,
  InferenceMode,
  InferenceSource,
} from "firebase/ai";
import type { ShiftRecon } from "./calc";
import type { Tank } from "./types";

export type HybridExecutionPath = "ON_DEVICE" | "CLOUD_FIREBASE_AI" | "OFFLINE_FALLBACK";

export type HybridBadgeLabel =
  | "On-Device AI"
  | "Cloud Gemini via Firebase AI"
  | "Offline Deterministic Fallback";

export interface HybridDiagnosticInput {
  shiftId: string;
  stationName: string;
  country: string;
  role: string;
  recon: ShiftRecon;
  tanks: Tank[];
}

export interface HybridDiagnosticResult {
  path: HybridExecutionPath;
  badgeLabel: HybridBadgeLabel;
  summary: string;
  modelNote: string;
  generatedAt: string;
}

const CLOUD_MODEL_NAME = "gemini-2.5-flash";

let appCheckInitialized = false;

function readFirebaseConfig() {
  return {
    apiKey: process.env.VITE_FIREBASE_API_KEY?.trim() || "",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || "",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID?.trim() || "",
    appId: process.env.VITE_FIREBASE_APP_ID?.trim() || "",
    appCheckDebugToken: process.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim() || "",
    recaptchaSiteKey: process.env.VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY?.trim() || "",
  };
}

function getOrInitFirebaseApp(): FirebaseApp | null {
  const cfg = readFirebaseConfig();
  if (!cfg.apiKey) return null;

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: cfg.apiKey,
          authDomain: cfg.authDomain || undefined,
          projectId: cfg.projectId || undefined,
          appId: cfg.appId || undefined,
        });

  if (typeof window !== "undefined" && !appCheckInitialized) {
    try {
      if (cfg.appCheckDebugToken) {
        const g = self as unknown as Record<string, unknown>;
        g.FIREBASE_APPCHECK_DEBUG_TOKEN =
          cfg.appCheckDebugToken === "true" ? true : cfg.appCheckDebugToken;
      }
      if (cfg.recaptchaSiteKey) {
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(cfg.recaptchaSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
        appCheckInitialized = true;
      }
    } catch {
      // App Check is optional; never block forecourt diagnostics if unavailable.
    }
  }

  return app;
}

function buildDiagnosticPrompt(input: HybridDiagnosticInput): string {
  const { shiftId, stationName, country, role, recon, tanks } = input;
  const tankMap = new Map(tanks.map((t) => [t.id, t]));

  const tankLines = recon.tanks.map((r) => {
    const tk = tankMap.get(r.tankId);
    const calMode = tk?.calibration.mode === "geometry" ? "cylindrical geometry" : "strapping chart";
    const varStr = r.varianceL === null ? "closing dip pending" : `${r.varianceL.toFixed(1)} L`;
    const flagStr = r.flags.length > 0 ? ` | Flags: ${r.flags.join("; ")}` : "";
    return `- ${tk?.name ?? r.tankId} (${r.product}, ${calMode}): Opening ${r.openingL.toFixed(1)} L, Delivered ${r.deliveredL.toFixed(1)} L, Dispensed ${r.dispensedL.toFixed(1)} L, Theoretical ${r.theoreticalL.toFixed(1)} L, Closing ${r.closingL === null ? "Pending" : `${r.closingL.toFixed(1)} L`}, Variance ${varStr} (Tol ±${r.tolL.toFixed(1)} L)${flagStr}`;
  });

  return [
    "You are an East African fuel forecourt wetstock compliance advisor.",
    "Write a concise supervisor shift-handover diagnostic (max 110 words, 3-4 short bullet points).",
    "Base your summary strictly on the deterministic numbers below. Do not invent measurements.",
    `Station: ${stationName} (${country}) | Shift: ${shiftId} | Role: ${role}`,
    `Status: ${recon.locked ? "LOCKED — investigation required" : "WITHIN TOLERANCE"} | All closing dips entered: ${recon.allClosingEntered ? "Yes" : "No"}`,
    `Revenue: Expected ${recon.currency} ${Math.round(recon.expectedRevenue).toLocaleString()}, Collected ${recon.currency} ${Math.round(recon.collected).toLocaleString()}, Shortfall ${recon.currency} ${Math.round(recon.shortfall).toLocaleString()} (Threshold ${recon.currency} ${recon.cashThreshold.toLocaleString()})`,
    "Tanks:",
    ...tankLines,
    recon.reasons.length > 0 ? `Lock reasons: ${recon.reasons.join("; ")}` : "Lock reasons: None",
    "Include: (1) overall shift risk status, (2) highest-priority tank or cash variance to check, and (3) concrete next step before supervisor sign-off.",
  ].join("\n");
}

export function buildOfflineDeterministicDiagnostic(
  input: HybridDiagnosticInput,
  reasonNote = "Deterministic local engine (Firebase API key not configured)"
): HybridDiagnosticResult {
  const { shiftId, recon, tanks } = input;
  const tankMap = new Map(tanks.map((t) => [t.id, t]));

  const lockedTanks = recon.tanks.filter((r) => r.locked);
  const pendingTanks = recon.tanks.filter((r) => r.closingL === null);
  const worstTank = recon.tanks
    .filter((r) => r.varianceL !== null)
    .sort((a, b) => Math.abs(b.varianceL ?? 0) - Math.abs(a.varianceL ?? 0))[0];

  const bullets: string[] = [];

  if (recon.locked) {
    bullets.push(
      `• Shift ${shiftId} is LOCKED (${recon.reasons.length} compliance trigger${recon.reasons.length === 1 ? "" : "s"}). Supervisor investigation is required before sign-off.`
    );
  } else if (pendingTanks.length > 0) {
    bullets.push(
      `• Shift ${shiftId} is OPEN with ${pendingTanks.length} closing dip${pendingTanks.length === 1 ? "" : "s"} pending. No tolerance breaches detected so far.`
    );
  } else {
    bullets.push(
      `• Shift ${shiftId} is WITHIN TOLERANCE across all ${recon.tanks.length} tanks and ready for supervisor sign-off.`
    );
  }

  if (lockedTanks.length > 0) {
    const names = lockedTanks
      .map((r) => {
        const name = tankMap.get(r.tankId)?.name ?? r.tankId;
        const v = r.varianceL === null ? "flag" : `${r.varianceL >= 0 ? "+" : ""}${r.varianceL.toFixed(1)} L`;
        return `${name} (${v} vs ±${r.tolL.toFixed(1)} L)`;
      })
      .join(", ");
    bullets.push(`• Wetstock focus: verify physical dipstick & ATG readings on ${names}.`);
  } else if (worstTank && worstTank.varianceL !== null) {
    const name = tankMap.get(worstTank.tankId)?.name ?? worstTank.tankId;
    bullets.push(
      `• Largest recorded variance: ${name} at ${worstTank.varianceL >= 0 ? "+" : ""}${worstTank.varianceL.toFixed(1)} L (within ±${worstTank.tolL.toFixed(1)} L tolerance).`
    );
  } else {
    bullets.push("• Record closing dips for all tanks to complete volumetric variance verification.");
  }

  if (Math.abs(recon.shortfall) > recon.cashThreshold) {
    bullets.push(
      `• Cash-up alert: ${recon.currency} ${Math.round(recon.shortfall).toLocaleString()} difference exceeds petty threshold (${recon.currency} ${recon.cashThreshold.toLocaleString()}). Reconcile cash, mobile money, and card slips.`
    );
  } else {
    bullets.push(
      `• Cash-up aligned: ${recon.currency} ${Math.round(recon.collected).toLocaleString()} collected vs ${recon.currency} ${Math.round(recon.expectedRevenue).toLocaleString()} expected.`
    );
  }

  if (recon.locked) {
    bullets.push("• Next step: log root cause in the Variance Investigation card before closing shift.");
  } else if (pendingTanks.length > 0) {
    bullets.push("• Next step: complete remaining closing dips and verify pump meter totals.");
  } else {
    bullets.push("• Next step: Supervisor or Station Manager can sign off and seal the ledger entry.");
  }

  return {
    path: "OFFLINE_FALLBACK",
    badgeLabel: "Offline Deterministic Fallback",
    summary: bullets.join("\n"),
    modelNote: reasonNote,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generates a concise Wetstock Variance & Shift Handover Diagnostic using
 * Firebase AI Logic (`firebase/ai`) in `InferenceMode.PREFER_ON_DEVICE` mode
 * (Chrome Gemini Nano on-device first, automatic cloud `gemini-2.5-flash` fallback),
 * with a clean deterministic offline fallback when Firebase config or connectivity is unavailable.
 */
export async function generateHybridWetstockDiagnostic(
  input: HybridDiagnosticInput
): Promise<HybridDiagnosticResult> {
  const app = getOrInitFirebaseApp();
  if (!app) {
    return buildOfflineDeterministicDiagnostic(input);
  }

  try {
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, {
      mode: InferenceMode.PREFER_ON_DEVICE,
      inCloudParams: {
        model: CLOUD_MODEL_NAME,
      },
    });

    const prompt = buildDiagnosticPrompt(input);
    const result = await model.generateContent(prompt);
    const text = result.response.text()?.trim();

    if (!text) {
      return buildOfflineDeterministicDiagnostic(
        input,
        "Empty model response — fell back to deterministic local diagnostic"
      );
    }

    const isOnDevice = result.response.inferenceSource === InferenceSource.ON_DEVICE;
    return {
      path: isOnDevice ? "ON_DEVICE" : "CLOUD_FIREBASE_AI",
      badgeLabel: isOnDevice ? "On-Device AI" : "Cloud Gemini via Firebase AI",
      summary: text,
      modelNote: isOnDevice
        ? "Chrome built-in Gemini Nano via Firebase AI Logic (PREFER_ON_DEVICE)"
        : `${CLOUD_MODEL_NAME} via Firebase AI Logic (PREFER_ON_DEVICE cloud fallback)`,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return buildOfflineDeterministicDiagnostic(
      input,
      "Offline / unavailable Firebase AI — deterministic local fallback active"
    );
  }
}

