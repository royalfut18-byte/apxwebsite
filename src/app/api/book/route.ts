import { cleanBooking, validateBooking } from "@/lib/booking";
import { sendBooking } from "@/lib/calls";

/**
 * Takes a booking from /book and passes it to APECS (see lib/calls.ts), where it goes in the
 * calendar as a call. Answers:
 *   200 { ok, start, end }   booked
 *   409 { taken }            someone got that time first: pick another
 *   422 { fields }           something in the form needs fixing
 *   502 / 503 / 429          couldn't book it: the page offers email instead
 */

const MAX_BODY_BYTES = 16_000;

/** A handful of bookings an hour from any one place is plenty. (Per server instance: a speed bump, not a wall.) */
const PER_HOUR = 4;
const recent = new Map<string, number[]>();
function tooMany(who: string) {
  const now = Date.now();
  const times = (recent.get(who) ?? []).filter((t) => now - t < 3_600_000);
  recent.set(who, times);
  if (recent.size > 5_000) recent.clear();
  return times.length >= PER_HOUR;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) return Response.json({ error: "That's too long." }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return Response.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  // Honeypot: a field people never see. Bots fill it; they get a polite success and nothing is booked.
  const fields = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};
  if (typeof fields.website === "string" && fields.website !== "") return Response.json({ ok: true });

  const booking = cleanBooking(payload);
  const errors = validateBooking(booking);
  if (Object.keys(errors).length > 0) {
    return Response.json({ error: "Please check the form.", fields: errors }, { status: 422 });
  }

  const who = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (tooMany(who)) {
    return Response.json(
      { error: "That's a lot of bookings. Email us instead.", fallback: "email" },
      { status: 429 },
    );
  }

  const result = await sendBooking(booking);
  if (result.status === "booked") {
    recent.get(who)?.push(Date.now());
    return Response.json({ ok: true, start: result.start, end: result.end });
  }
  if (result.status === "taken")
    return Response.json({ error: "Someone just took that time.", taken: true }, { status: 409 });
  if (result.status === "invalid") return Response.json({ error: result.error }, { status: 422 });
  return Response.json({ error: "We couldn't book that just now.", fallback: "email" }, { status: 502 });
}
