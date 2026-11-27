/**
 * Shared between the booking page (/book) and the endpoints it posts to. The free times
 * themselves come from APECS, which keeps the calendar (see lib/calls.ts): weekdays from 9 am to
 * a last call at 9:30 pm Sydney time, an hour's notice at least, up to two weeks ahead.
 */

import { isPhone } from "./contact";

/** How long a call is, in minutes. */
export const CALL_MINUTES = 10;

/** Where we are: the times are worked out in Sydney time and shown in the visitor's own. */
export const HOME_ZONE = "Australia/Sydney";

export const BOOKING_LIMITS = { name: 120, phone: 25, business: 160, message: 1000 } as const;

export type Booking = {
  /** When the call starts, as an ISO date. */
  start: string;
  name: string;
  /** The only way we ask to reach them: no email. */
  phone: string;
  business: string;
  message: string;
  /** The visitor's own time zone, e.g. "Australia/Perth": the one they saw the times in. */
  timeZone: string;
};

export type BookingErrors = Partial<Record<"start" | "name" | "phone", string>>;

/** Trims and bounds whatever came in, so the same rules apply in the browser and on the server. */
export function cleanBooking(input: unknown): Booking {
  const raw = (typeof input === "object" && input !== null ? input : {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");
  const at = typeof raw.start === "string" ? Date.parse(raw.start) : NaN;
  return {
    start: Number.isFinite(at) ? new Date(at).toISOString() : "",
    name: text(raw.name, BOOKING_LIMITS.name),
    phone: text(raw.phone, BOOKING_LIMITS.phone),
    business: text(raw.business, BOOKING_LIMITS.business),
    message: text(raw.message, BOOKING_LIMITS.message),
    timeZone: text(raw.timeZone, 64),
  };
}

export function validateBooking(booking: Booking): BookingErrors {
  const errors: BookingErrors = {};
  if (!booking.start) errors.start = "Pick a time first.";
  if (!booking.name) errors.name = "Tell us your name.";
  if (!booking.phone) errors.phone = "We need a number to call you on.";
  else if (!isPhone(booking.phone)) errors.phone = "That number doesn't look right.";
  return errors;
}

/* ---------------------------------------------------------------------------
   Dates, in whichever time zone the visitor is in
   --------------------------------------------------------------------------- */

const formats = new Map<string, Intl.DateTimeFormat>();
function format(zone: string, options: Intl.DateTimeFormatOptions) {
  const key = zone + JSON.stringify(options);
  let f = formats.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat("en-AU", { timeZone: zone, ...options });
    formats.set(key, f);
  }
  return f;
}

/** The visitor's time zone, or Sydney's when the browser won't say. */
export function visitorZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone) {
      format(zone, { hour: "numeric" }); // throws for a zone this browser can't use
      return zone;
    }
  } catch {
    // fall through
  }
  return HOME_ZONE;
}

/** "2026-12-02": the date a moment falls on in a time zone. */
export function dayKey(iso: string, zone: string) {
  const p = Object.fromEntries(
    format(zone, { year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/** The free times grouped by day, in the visitor's time zone, earliest first. */
export function groupByDay(slots: string[], zone: string) {
  const days = new Map<string, string[]>();
  for (const slot of [...slots].sort()) {
    const key = dayKey(slot, zone);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  return [...days].map(([key, times]) => ({ key, times }));
}

/** "9:00 am" */
export const clock = (iso: string, zone: string) =>
  format(zone, { hour: "numeric", minute: "2-digit" }).format(new Date(iso)).replace(/\s/g, " ");

/** The hour on the clock (0 to 23), for splitting the morning from the afternoon. */
export const hourOf = (iso: string, zone: string) =>
  Number(format(zone, { hour: "2-digit", hourCycle: "h23" }).format(new Date(iso))) % 24;

/** "Wednesday 2 December" */
export const longDay = (iso: string, zone: string) =>
  format(zone, { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso)).replace(",", "");

/** { weekday: "Wed", day: "2", month: "Dec" }, for the day buttons. */
export function dayParts(iso: string, zone: string) {
  const p = Object.fromEntries(
    format(zone, { weekday: "short", day: "numeric", month: "short" })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return { weekday: p.weekday, day: p.day, month: p.month };
}

/** "AEDT", "AWST", or a "GMT+1" style name where there is no short one. */
export const zoneName = (iso: string, zone: string) =>
  format(zone, { timeZoneName: "short" })
    .formatToParts(new Date(iso))
    .find((x) => x.type === "timeZoneName")?.value ?? "";

/** "Perth" from "Australia/Perth". */
export const zoneCity = (zone: string) => (zone.split("/").pop() ?? zone).replace(/_/g, " ");

/** Whether a time zone's clocks read the same as Sydney's at that moment. */
export const sameClockAsHome = (iso: string, zone: string) =>
  zone === HOME_ZONE ||
  clock(iso, zone) + dayKey(iso, zone) === clock(iso, HOME_ZONE) + dayKey(iso, HOME_ZONE);

/** "Perth (AWST)" */
export const zoneLabel = (zone: string, at: string) => `${zoneCity(zone)} (${zoneName(at, zone)})`;

/** The time zones in the picker: Australia's first, then a few common ones. */
export const ZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Darwin",
  "Australia/Perth",
  "Australia/Hobart",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Asia/Dubai",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

/** The picker's zones, with the visitor's own added at the top when it isn't one of them. */
export const zoneChoices = (own: string) => (ZONES.includes(own) ? ZONES : [own, ...ZONES]);

/* ---------------------------------------------------------------------------
   The month calendar. Days are plain dates ("2026-12-02") in the visitor's time
   zone, so the sums below are done in UTC, where no clock changes get in the way.
   --------------------------------------------------------------------------- */

/** Weeks start on Monday, as Australian calendars do. */
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const ymd = (day: string) => day.split("-").map(Number) as [number, number, number];

/** "2026-12" from "2026-12-02". */
export const monthOf = (day: string) => day.slice(0, 7);

/** The month `n` months on from "2026-12" ("2027-01" for 1, "2026-11" for -1). */
export function addMonths(month: string, n: number) {
  const [y, m] = ymd(month);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const monthFormat = new Intl.DateTimeFormat("en-AU", { month: "long", timeZone: "UTC" });
const dayFormat = new Intl.DateTimeFormat("en-AU", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

/** { name: "December", year: "2026" } for "2026-12". */
export function monthName(month: string) {
  const [y, m] = ymd(month);
  return { name: monthFormat.format(Date.UTC(y, m - 1, 1)), year: String(y) };
}

/** "Wednesday 2 December" for "2026-12-02". */
export function dayLabel(day: string) {
  const [y, m, d] = ymd(day);
  return dayFormat.format(Date.UTC(y, m - 1, d)).replace(",", "");
}

/**
 * A month laid out in weeks, Monday first: each cell is a day ("2026-12-02"), or null for
 * the blanks before the 1st and after the last day.
 */
export function monthGrid(month: string) {
  const [y, m] = ymd(month);
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= length; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** When the call ends: "9:40 am" for a 9:30 start. */
export const endClock = (start: string, zone: string) =>
  clock(new Date(Date.parse(start) + CALL_MINUTES * 60_000).toISOString(), zone);

/* ---------------------------------------------------------------------------
   Putting the call in the visitor's own calendar
   --------------------------------------------------------------------------- */

const stamp = (iso: string) =>
  new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

export function callSummary(siteName: string) {
  return `${CALL_MINUTES}-minute call with ${siteName}`;
}

/** A Google Calendar link that opens the call ready to save. */
export function googleCalendarLink(start: string, end: string, siteName: string, details: string) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: callSummary(siteName),
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** The same call as an .ics file (Apple Calendar, Outlook and the rest), as a data: address. */
export function icsFile(start: string, end: string, siteName: string, details: string, site: string) {
  const escape = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");
  const host = new URL(site).hostname;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${siteName}//Booking//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:call-${stamp(start)}@${host}`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(callSummary(siteName))}`,
    `DESCRIPTION:${escape(details)}`,
    `URL:${site}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join("\r\n"))}`;
}
