import { CALL_MINUTES, HOME_ZONE, type Booking } from "./booking";

/**
 * The booking page's link to APECS, which keeps the calendar: it says which times are free
 * and takes each booking, which lands in its Calendar as a call. Only the server talks to it,
 * so the key never reaches a visitor's browser.
 *
 * Nothing to set up for APXS: when LEADS_WEBHOOK_URL is APECS's website-leads address
 * (…/api/leads/website), bookings go to the address next to it (…/api/calls/website) with
 * the same LEADS_WEBHOOK_SECRET. To point them somewhere else, set:
 *
 *   BOOKING_API_URL     the booking address
 *   BOOKING_API_SECRET  its key, sent as "Authorization: Bearer <secret>"
 */

export type FreeTimes = { slots: string[]; minutes: number; timeZone: string };

export type BookingResult =
  | { status: "booked"; start: string; end: string }
  | { status: "taken" }
  | { status: "invalid"; error: string }
  | { status: "unavailable" };

export function bookingApi(env: NodeJS.ProcessEnv = process.env): { url: URL; secret: string } | null {
  const secret = (env.BOOKING_API_SECRET || env.LEADS_WEBHOOK_SECRET || "").trim();
  let url: URL | null = null;
  try {
    const own = env.BOOKING_API_URL?.trim();
    const leads = env.LEADS_WEBHOOK_URL?.trim();
    if (own) url = new URL(own);
    else if (leads) {
      const inbox = new URL(leads);
      // Only APECS takes bookings. A chat webhook (Discord, Slack…) must never be sent the key.
      if (inbox.pathname.replace(/\/+$/, "") === "/api/leads/website")
        url = new URL("/api/calls/website", inbox);
    }
  } catch {
    url = null;
  }
  if (!url || (url.protocol !== "https:" && url.protocol !== "http:") || !secret) return null;
  return { url, secret };
}

/** The free times, straight from APECS. `null` when booking isn't set up or can't be reached. */
export async function fetchFreeTimes(env: NodeJS.ProcessEnv = process.env): Promise<FreeTimes | null> {
  const api = bookingApi(env);
  if (!api) return null;
  try {
    const response = await fetch(api.url, {
      headers: { Authorization: `Bearer ${api.secret}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      // The address itself is never logged: with the key it is as good as a password.
      console.error(`Booking: APECS (${api.url.hostname}) answered ${response.status} when asked for times`);
      return null;
    }
    const data = (await response.json()) as Partial<FreeTimes>;
    if (!Array.isArray(data.slots)) return null;
    return {
      slots: data.slots.filter((s): s is string => typeof s === "string" && Number.isFinite(Date.parse(s))),
      minutes: Number(data.minutes) || CALL_MINUTES,
      timeZone: typeof data.timeZone === "string" ? data.timeZone : HOME_ZONE,
    };
  } catch (error) {
    console.error(`Booking: could not reach APECS (${api.url.hostname}) for times`, error);
    return null;
  }
}

/** Books the call in APECS. */
export async function sendBooking(
  booking: Booking,
  env: NodeJS.ProcessEnv = process.env,
): Promise<BookingResult> {
  const api = bookingApi(env);
  if (!api) return { status: "unavailable" };
  try {
    const response = await fetch(api.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${api.secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({ type: "call", ...booking }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      start?: string;
      end?: string;
      error?: string;
    };
    if (response.status === 201 && data.ok) {
      const start = data.start ?? booking.start;
      return {
        status: "booked",
        start,
        end: data.end ?? new Date(Date.parse(start) + CALL_MINUTES * 60_000).toISOString(),
      };
    }
    if (response.status === 409) return { status: "taken" };
    if (response.status === 400) return { status: "invalid", error: data.error || "Please check the form." };
    console.error(
      `Booking: APECS (${api.url.hostname}) answered ${response.status}`,
      String(data.error ?? "").slice(0, 200),
    );
    return { status: "unavailable" };
  } catch (error) {
    console.error(`Booking: could not reach APECS (${api.url.hostname})`, error);
    return { status: "unavailable" };
  }
}
