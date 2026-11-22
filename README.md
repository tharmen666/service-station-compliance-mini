# Service Station Compliance Mini

Wetstock reconciliation, dipstick calibration, shift handover, emergency drill, and training compliance for East African fuel forecourts — built with **Next.js 15**, **deterministic client-side tank strapping**, and **Firebase AI Logic (`firebase/ai`)** hybrid on-device + cloud inference for the **Google #BuildHybridAI 2026** hackathon.

Live deployment: https://service-station-compliance-mini.vercel.app

## Hybrid AI Architecture

Service Station Compliance Mini separates safety-critical volumetric math from natural-language supervisor diagnostics:

1. **Deterministic Client-Side Engine (`src/lib/calc.ts`, `src/lib/ledger.ts`)**
   - Horizontal cylindrical tank geometry and strapping-table linear interpolation (`cm` → `litres`) run 100% deterministically in the browser.
   - Wetstock reconciliation (`Opening + Deliveries - Pump Meter Sales` vs. physical closing dip), currency petty-threshold checks, Omnicomm delivery variance checks, and SHA-256 hash-chained audit ledger entries never depend on an LLM.

2. **Hybrid On-Device + Cloud Inference (`src/lib/hybridAiDiagnostics.ts`)**
   - Uses the official **`firebase/ai`** SDK (`getAI`, `getGenerativeModel`, `GoogleAIBackend`, `InferenceMode`) configured with **`InferenceMode.PREFER_ON_DEVICE`**.
   - **On-Device First:** When running in a browser with Chrome built-in Gemini Nano available, the **Wetstock Variance & Shift Handover Diagnostic** runs locally on-device with zero network latency and full forecourt data privacy.
   - **Cloud Fallback:** When on-device AI is unavailable, Firebase AI Logic automatically routes the request to **`gemini-2.5-flash`** in the cloud (optionally protected by **Firebase App Check** via `ReCaptchaEnterpriseProvider` or `FIREBASE_APPCHECK_DEBUG_TOKEN`).
   - **Offline Deterministic Fallback:** If `VITE_FIREBASE_API_KEY` is not configured or the device is completely offline without on-device AI, the app seamlessly generates a structured local supervisor handover diagnostic so forecourt operations never fail or block shift sign-off.

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation & Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Visit `/shift` (or the dashboard `/`) and click **"Analyze Variance with Hybrid AI"** in the **Hybrid AI Shift & Variance Diagnostic** panel.

### Environment Variables

Copy `.env.example` to `.env.local` and configure your Firebase project keys (all keys are optional — leaving them blank activates the **Offline Deterministic Fallback**):

| Variable | Description |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain (`<project>.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase / Google Cloud project ID |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID |
| `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` | Optional App Check debug token (`true` or registered UUID for local dev) |
| `VITE_FIREBASE_RECAPTCHA_ENTERPRISE_SITE_KEY` | Optional reCAPTCHA Enterprise site key for production App Check |

### Scripts

```bash
npm run dev        # Start Next.js development server
npm run typecheck  # Run TypeScript type checking (tsc --noEmit)
npm run build      # Build production bundle
npm run start      # Start production server
```

## License

Copyright 2026 Desigan Tharmen. Licensed under the [Apache License, Version 2.0](./LICENSE).

