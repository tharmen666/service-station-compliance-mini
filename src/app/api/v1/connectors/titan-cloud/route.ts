import { NextResponse } from "next/server";
import { validateTitan } from "@/lib/connectors";

export const runtime = "nodejs";

// Titan Cloud ATG ingest. Validates and echoes the normalised record.
// Persistence is per-device in this mini build; this endpoint is a contract for integrators.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "rejected", errors: ["Body must be valid JSON"] }, { status: 400 });
  }
  const result = validateTitan(body);
  if (!result.ok) return NextResponse.json({ status: "rejected", errors: result.errors }, { status: 422 });
  return NextResponse.json({ status: "accepted", received: result.value }, { status: 202 });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/connectors/titan-cloud",
    method: "POST",
    contentType: "application/json",
    fields: {
      stationId: "string",
      date: "YYYY-MM-DD",
      readings: "[{ tankId: string, closingL: number >= 0, waterCm?: number >= 0 }]",
    },
  });
}
