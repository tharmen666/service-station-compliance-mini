import { NextResponse } from "next/server";
import { validateOmis } from "@/lib/connectors";

export const runtime = "nodejs";

// OMIS 4.0 outbound escalation. Forwards to OMIS_WEBHOOK_URL when configured
// (server environment variable); otherwise the ticket is kept locally and reported as local_only.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "rejected", errors: ["Body must be valid JSON"] }, { status: 400 });
  }
  const result = validateOmis(body);
  if (!result.ok) return NextResponse.json({ status: "rejected", errors: result.errors }, { status: 422 });

  const url = process.env.OMIS_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json({ status: "local_only", ticket: result.value }, { status: 202 });
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(result.value),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ status: "failed", upstreamStatus: res.status }, { status: 502 });
    return NextResponse.json({ status: "forwarded", ticket: result.value }, { status: 202 });
  } catch {
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/connectors/omis-4",
    method: "POST",
    contentType: "application/json",
    fields: {
      stationId: "string",
      ticketType: "PUMP_METER_DRIFT | UST_WATER_INGRESS | WETSTOCK_VARIANCE",
      severity: "HIGH | CRITICAL",
      asset: "string",
      detail: "string (max 500)",
      raisedAt: "ISO-8601 timestamp",
    },
  });
}
