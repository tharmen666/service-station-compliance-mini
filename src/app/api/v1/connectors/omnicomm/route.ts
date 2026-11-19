import { NextResponse } from "next/server";
import { validateOmnicomm } from "@/lib/connectors";

export const runtime = "nodejs";

// Omnicomm tanker dispatch receiver. The client matches dispatchL against
// pre-drop and post-drop dips using the delivery tolerance in Settings.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "rejected", errors: ["Body must be valid JSON"] }, { status: 400 });
  }
  const result = validateOmnicomm(body);
  if (!result.ok) return NextResponse.json({ status: "rejected", errors: result.errors }, { status: 422 });
  return NextResponse.json({ status: "accepted", received: result.value }, { status: 202 });
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/v1/connectors/omnicomm",
    method: "POST",
    contentType: "application/json",
    fields: {
      stationId: "string",
      waybillNo: "string",
      tankId: "string (optional)",
      dispatchL: "number > 0",
      gpsArrivalIso: "ISO-8601 timestamp",
    },
  });
}
