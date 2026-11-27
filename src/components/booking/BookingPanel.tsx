"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { useIsClient } from "@/hooks/useIsClient";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  BOOKING_LIMITS,
  CALL_MINUTES,
  HOME_ZONE,
  cleanBooking,
  clock,
  dayKey,
  dayParts,
  endClock,
  googleCalendarLink,
  groupByDay,
  hourOf,
  icsFile,
  longDay,
  monthOf,
  sameClockAsHome,
  validateBooking,
  visitorZone,
  zoneChoices,
  zoneLabel,
  zoneName,
  type Booking,
  type BookingErrors,
} from "@/lib/booking";
import { cn, ease } from "@/lib/cn";
import { tidyPhone } from "@/lib/contact";
import { site } from "@/lib/site";

import { Logo } from "../Logo";
import { Magnetic } from "../ui/Magnetic";
import { ArrowIcon, CalendarIcon, ChevronIcon, ClockIcon, GlobeIcon, PhoneIcon, SparkIcon } from "./icons";
import { MonthCalendar } from "./MonthCalendar";

type Details = Pick<Booking, "name" | "phone" | "business" | "message">;
type Status = "idle" | "sending" | "booked" | "error";

const EMPTY: Details = { name: "", phone: "", business: "", message: "" };
/** Times loaded longer ago than this are fetched again when the visitor comes back to the tab. */
const STALE_MS = 5 * 60_000;

const noop = () => () => {};

/** The free times from APECS (through this site's own server), or null when booking is unavailable. */
async function getFreeTimes(): Promise<string[] | null> {
  try {
    // A plain request, so the first one picks up the copy the page asked for in advance (app/book/page.tsx).
    const response = await fetch("/api/book/slots");
    const data = (await response.json().catch(() => ({}))) as { slots?: unknown };
    if (!response.ok || !Array.isArray(data.slots)) return null;
    return data.slots.filter((s): s is string => typeof s === "string");
  } catch {
    return null;
  }
}

function mailto(subject: string, body: string) {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "Wednesday 2 December, 2:15 pm AWST (3:15 pm Sydney time)", for emails. */
function when(start: string, zone: string) {
  const here = `${longDay(start, zone)}, ${clock(start, zone)}`;
  return sameClockAsHome(start, zone)
    ? `${here} Sydney time`
    : `${here} ${zoneName(start, zone)} (${clock(start, HOME_ZONE)} Sydney time)`;
}

type FieldProps = {
  label: string;
  name: keyof Details;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength: number;
  multiline?: boolean;
  placeholder?: string;
};

function Field({
  label,
  name,
  value,
  onChange,
  error,
  optional,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  multiline,
  placeholder,
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    value,
    maxLength,
    placeholder,
    autoComplete,
    required: !optional,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined,
    className: cn(
      "mt-2.5 block w-full rounded-2xl border bg-white/[0.04] px-4 py-3.5 text-[1.0625rem] text-bone outline-none transition-[border-color,background-color,box-shadow] duration-300 placeholder:text-faint focus:bg-white/[0.07] focus:shadow-[0_0_0_4px_rgba(255,91,46,0.16)]",
      error ? "border-ember" : "border-white/10 hover:border-white/25 focus:border-ember",
    ),
  };
  return (
    <div className="relative">
      <label htmlFor={id} className="label flex items-center justify-between text-mute">
        <span>{label}</span>
        {optional ? <span className="normal-case tracking-normal text-faint">Optional</span> : null}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={3}
          className={cn(shared.className, "resize-none leading-relaxed")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input {...shared} type={type} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
      )}
      <AnimatePresence>
        {error ? (
          <motion.p
            id={errorId}
            role="alert"
            className="absolute -bottom-6 left-0 text-[0.8125rem] font-medium text-ember"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** A pill-shaped link: solid (bone, turning ember) or outlined. */
function Pill({
  href,
  children,
  solid,
  download,
  external,
}: {
  href: string;
  children: React.ReactNode;
  solid?: boolean;
  download?: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      download={download}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className={cn(
        "inline-flex h-12 items-center whitespace-nowrap rounded-full px-6 text-[0.9375rem] font-semibold transition-colors duration-300",
        solid ? "bg-bone text-ink hover:bg-ember" : "border border-white/20 text-bone hover:border-white/50",
      )}
    >
      {children}
    </a>
  );
}

/** A soft placeholder while the times load. */
const Skeleton = ({ className }: { className: string }) => (
  <span
    aria-hidden="true"
    className={cn("block animate-pulse bg-white/[0.06] still:animate-none", className)}
  />
);

const CARD =
  "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-800 shadow-[0_40px_120px_-40px_rgba(255,91,46,0.35)] md:rounded-[2.25rem]";

/** A line of the site's colours along the top edge, and a soft light under it (as on the contact form). */
const EDGE = (
  <>
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 z-10 h-[3px] bg-[linear-gradient(to_right,var(--color-violet),var(--color-rose)_45%,var(--color-ember))]"
    />
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,91,46,0.13),transparent)]"
    />
  </>
);

/* ---------------------------------------------------------------------------
   The left-hand column: what the call is, and once a time is chosen, when
   --------------------------------------------------------------------------- */

type CallInfoProps = {
  zone: string | null;
  own: string | null;
  /** Any moment near the calls, for the zones' short names (AEDT or AEST, depending on the season). */
  at: string;
  onZone: (zone: string) => void;
  chosen: string | null;
  onChange?: () => void;
  /** On a phone, show only the chosen time (so the form below starts near the top). */
  compact?: boolean;
};

function CallInfo({ zone, own, at, onZone, chosen, onChange, compact }: CallInfoProps) {
  return (
    <div className="grid content-start gap-7">
      <div className={cn(compact && "hidden lg:block")}>
        <Logo className="block h-[13px] w-auto text-bone" />
        <h2 className="display mt-6 text-[clamp(1.85rem,2.6vw,2.5rem)] text-bone">
          Intro <span className="accent">call.</span>
        </h2>
        <p className="mt-3 hidden max-w-xs text-[0.9375rem] leading-relaxed text-bone-dim lg:block">
          A quick chat about your business and what would help it most. No prep needed.
        </p>
      </div>
      <ul
        className={cn(
          "grid gap-3.5 text-[0.9375rem] text-bone-dim sm:grid-cols-2 lg:grid-cols-1",
          compact && "hidden lg:grid",
        )}
      >
        <li className="flex items-center gap-3">
          <ClockIcon className="h-4 w-4 shrink-0 text-ember" /> {CALL_MINUTES} minutes
        </li>
        <li className="flex items-center gap-3">
          <PhoneIcon className="h-4 w-4 shrink-0 text-ember" /> Phone call: we ring you
        </li>
        <li className="flex items-center gap-3">
          <SparkIcon className="h-4 w-4 shrink-0 text-ember" /> Free, no obligation
        </li>
        <li className="flex items-center gap-3">
          <GlobeIcon className="h-4 w-4 shrink-0 text-ember" />
          {zone && own ? (
            <label className="relative -my-2 flex min-w-0 items-center">
              <span className="sr-only">Time zone</span>
              <select
                value={zone}
                onChange={(e) => onZone(e.target.value)}
                data-testid="zone"
                className="h-10 min-w-0 cursor-pointer appearance-none truncate bg-transparent pr-6 text-bone-dim outline-none transition-colors hover:text-bone focus-visible:text-bone"
              >
                {zoneChoices(own).map((z) => (
                  <option key={z} value={z} className="bg-ink-800 text-bone">
                    {zoneLabel(z, at)}
                  </option>
                ))}
              </select>
              <ChevronIcon dir="down" className="pointer-events-none absolute right-0 h-3.5 w-3.5" />
            </label>
          ) : (
            <Skeleton className="h-4 w-32 rounded-full" />
          )}
        </li>
      </ul>

      <AnimatePresence initial={false}>
        {chosen && zone ? (
          <motion.div
            key="chosen"
            data-testid="chosen"
            className="rounded-2xl border border-ember/35 bg-ember/[0.08] p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.5, ease: ease.expo }}
          >
            <p className="label text-ember">Your call</p>
            <p className="mt-3.5 flex items-center gap-2.5 text-bone">
              <CalendarIcon className="h-4 w-4 shrink-0 text-bone-dim" /> {longDay(chosen, zone)}
            </p>
            <p className="mt-2 flex items-center gap-2.5 font-mono text-[0.9375rem] text-bone">
              <ClockIcon className="h-4 w-4 shrink-0 text-bone-dim" /> {clock(chosen, zone)} –{" "}
              {endClock(chosen, zone)}
            </p>
            {sameClockAsHome(chosen, zone) ? null : (
              <p className="mt-2 pl-[1.625rem] text-[0.8125rem] text-bone-dim">
                {clock(chosen, HOME_ZONE)} in Sydney
              </p>
            )}
            {onChange ? (
              <button
                type="button"
                onClick={onChange}
                className="link-sweep mt-4 pb-0.5 text-[0.875rem] font-medium text-bone-dim hover:text-bone"
              >
                Change the time
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Booked: the call as a ticket
   --------------------------------------------------------------------------- */

function Ticket({ start, zone }: { start: string; zone: string }) {
  const p = dayParts(start, zone);
  return (
    <motion.div
      aria-hidden="true"
      className="relative mx-auto w-44 shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink text-center shadow-[0_30px_80px_-30px_rgba(255,91,46,0.6)] md:mx-0"
      initial={{ opacity: 0, y: 28, rotate: -8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, rotate: -2.5, scale: 1 }}
      transition={{ duration: 1.1, ease: ease.expo }}
    >
      <div className="bg-ember py-2.5 font-mono text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-ink">
        {p.month}
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="display text-[4.75rem] leading-none text-bone">{p.day}</div>
        <div className="label mt-3 text-mute">{p.weekday}</div>
      </div>
      <div className="relative border-t border-dashed border-white/15 py-3.5 font-mono text-[0.9375rem] text-bone">
        {/* The notches of a tear-off stub. */}
        <span className="absolute -left-2.5 -top-2.5 h-5 w-5 rounded-full border border-white/10 bg-ink-800" />
        <span className="absolute -right-2.5 -top-2.5 h-5 w-5 rounded-full border border-white/10 bg-ink-800" />
        {clock(start, zone)}
      </div>
    </motion.div>
  );
}

/* ---------------------------------------------------------------------------
   The panel
   --------------------------------------------------------------------------- */

export function BookingPanel() {
  // The visitor's time zone is only known in the browser. Until then (and on the server) the
  // panel shows its loading state, which doesn't depend on it.
  const own = useSyncExternalStore(noop, visitorZone, () => null);
  const [picked, setPicked] = useState<string | null>(null);
  const zone = picked ?? own;
  const reduced = useReducedMotion();
  const isClient = useIsClient();

  const [slots, setSlots] = useState<string[]>([]);
  const [load, setLoad] = useState<"loading" | "ready" | "unavailable">("loading");
  const [loadedAt, setLoadedAt] = useState(0);
  const [step, setStep] = useState<"pick" | "details">("pick");
  const [month, setMonth] = useState<string | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<BookingErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [taken, setTaken] = useState(false);
  const [booked, setBooked] = useState<{ start: string; end: string } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const timesRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastStep = useRef(step);

  /** Times someone else took while this visitor was booking: kept out even if a slightly old copy still has them. */
  const gone = useRef(new Set<string>());

  const apply = useCallback((free: string[] | null) => {
    if (!free) {
      setLoad("unavailable");
      return;
    }
    // The list may be a copy kept for a while (see api/book/slots): drop times that are now too soon.
    const soonest = Date.now() + 55 * 60_000;
    setLoadedAt(Date.now());
    setSlots(free.filter((s) => Date.parse(s) >= soonest && !gone.current.has(s)));
    setLoad("ready");
  }, []);

  useEffect(() => {
    let live = true;
    getFreeTimes().then((free) => live && apply(free));
    return () => {
      live = false;
    };
  }, [apply]);

  // Someone may have booked a time while this tab sat in the background.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible" || Date.now() - loadedAt < STALE_MS) return;
      getFreeTimes().then((free) => free && apply(free));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [apply, loadedAt]);

  const days = useMemo(() => (zone ? groupByDay(slots, zone) : []), [slots, zone]);
  const free = useMemo(() => new Map(days.map((d) => [d.key, d.times.length])), [days]);
  const current = days.find((d) => d.key === day) ?? days[0] ?? null;
  // A time that has gone (booked by someone else) is no longer chosen.
  const chosen = time && slots.includes(time) ? time : null;
  const lost = Boolean(time) && !chosen && load === "ready";
  const timeGroups = useMemo(() => {
    if (!current || !zone) return [];
    const parts = [
      { label: "Morning", times: current.times.filter((t) => hourOf(t, zone) < 12) },
      {
        label: "Afternoon",
        times: current.times.filter((t) => hourOf(t, zone) >= 12 && hourOf(t, zone) < 17),
      },
      { label: "Evening", times: current.times.filter((t) => hourOf(t, zone) >= 17) },
    ].filter((g) => g.times.length > 0);
    let from = 0;
    return parts.map((g) => {
      const group = { ...g, from };
      from += g.times.length;
      return group;
    });
  }, [current, zone]);
  const first = days.length ? monthOf(days[0].key) : "";
  const last = days.length ? monthOf(days[days.length - 1].key) : "";
  const wanted = month ?? (current ? monthOf(current.key) : first);
  const shownMonth = wanted < first ? first : wanted > last ? last : wanted;
  const today = zone && loadedAt ? dayKey(new Date(loadedAt).toISOString(), zone) : "";
  const at = slots[0] ?? (loadedAt ? new Date(loadedAt).toISOString() : "2026-01-01T00:00:00.000Z");

  // Moving between the steps: the heading of the new step gets the keyboard focus, and on a
  // phone the top of the panel comes back into view.
  useEffect(() => {
    if (lastStep.current === step) return;
    lastStep.current = step;
    if (step === "details") headingRef.current?.focus({ preventScroll: true });
    else timesRef.current?.querySelector<HTMLElement>("[aria-pressed=true]")?.focus({ preventScroll: true });
    const panel = panelRef.current;
    if (panel && panel.getBoundingClientRect().top < 0) {
      panel.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }, [step, reduced]);

  const set = <K extends keyof Details>(key: K, value: Details[K]) => {
    setDetails((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  function pickDay(key: string) {
    setDay(key);
    setTaken(false);
  }

  function pickTime(slot: string) {
    setTime(slot);
    setTaken(false);
  }

  function changeZone(next: string) {
    setPicked(next);
    // The same moment may fall on a different date over there.
    const anchor = chosen ?? current?.times[0];
    if (anchor) {
      setDay(dayKey(anchor, next));
      setMonth(monthOf(dayKey(anchor, next)));
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const booking = cleanBooking({ ...details, start: chosen ?? "", timeZone: zone ?? HOME_ZONE });
    const found = validateBooking(booking);
    setErrors(found);
    if (found.start) {
      setStep("pick");
      return;
    }
    if (Object.keys(found).length > 0) {
      const first = (["name", "phone"] as const).find((k) => found[k]);
      if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...booking, website }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        start?: string;
        end?: string;
        fields?: BookingErrors;
      };
      if (response.ok && data.ok) {
        const start = data.start ?? booking.start;
        setBooked({
          start,
          end: data.end ?? new Date(Date.parse(start) + CALL_MINUTES * 60_000).toISOString(),
        });
        setStatus("booked");
        panelRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        return;
      }
      if (response.status === 409) {
        // Someone got there first. Back to the times that are still free; what they typed is kept.
        gone.current.add(booking.start);
        setSlots((prev) => prev.filter((s) => s !== booking.start));
        setStatus("idle");
        setTime(null);
        setTaken(true);
        setStep("pick");
        getFreeTimes().then((free) => free && apply(free));
        return;
      }
      if (response.status === 422 && data.fields) {
        setErrors(data.fields);
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const firstName = details.name.trim().split(/\s+/)[0];
  /** What goes in the email when booking online doesn't work out: the time and what they typed. */
  const fallbackBody = (start: string | null) => {
    const lines = [
      `Hi ${site.name}, I'd like to book a ${CALL_MINUTES}-minute call.`,
      "",
      start && zone ? `Time: ${when(start, zone)}` : "Times that suit me: ",
    ];
    const add = (label: string, value: string) => value.trim() && lines.push(`${label}: ${value.trim()}`);
    add("Name", details.name);
    add("Phone", details.phone);
    add("Business", details.business);
    if (details.message.trim()) lines.push("", details.message.trim());
    return lines.join("\n");
  };

  /* ------------------------------------------------------------- Booked */
  if (status === "booked" && booked) {
    const zoneNow = zone ?? HOME_ZONE;
    const detailsText = `We'll ring you on ${tidyPhone(details.phone)}.\n\nNeed to change it? Email ${site.email}.`;
    return (
      <motion.div
        ref={panelRef}
        role="status"
        className={cn(CARD, "scroll-mt-28 p-6 md:p-10 lg:p-14")}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: ease.expo }}
      >
        {EDGE}
        <div className="relative grid items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14 lg:gap-20">
          <Ticket start={booked.start} zone={zoneNow} />
          <div className="min-w-0">
            <svg viewBox="0 0 64 64" className="h-12 w-12 text-ember" fill="none" aria-hidden="true">
              <motion.circle
                cx="32"
                cy="32"
                r="29"
                stroke="currentColor"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: ease.inOut }}
              />
              <motion.path
                d="m20 33 8.5 8.5L45 24"
                stroke="currentColor"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, ease: ease.quart, delay: 0.6 }}
              />
            </svg>
            <h2 className="display mt-6 text-[clamp(2.25rem,5vw,4rem)] text-bone">
              You&rsquo;re booked{firstName ? `, ${firstName}` : ""}.
            </h2>
            <p
              className="mt-5 text-[clamp(1.15rem,1.9vw,1.45rem)] font-medium leading-snug text-bone"
              data-testid="booked-when"
            >
              {longDay(booked.start, zoneNow)}, {clock(booked.start, zoneNow)} –{" "}
              {endClock(booked.start, zoneNow)}
              <span className="text-bone-dim">
                {" "}
                {sameClockAsHome(booked.start, zoneNow)
                  ? `(${zoneName(booked.start, HOME_ZONE)}, Sydney time)`
                  : `your time (${clock(booked.start, HOME_ZONE)} in Sydney)`}
              </span>
            </p>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-bone-dim">
              We&rsquo;ll ring you on <span className="text-bone">{tidyPhone(details.phone)}</span> for a
              quick {CALL_MINUTES}-minute chat. No prep needed: just tell us about your business.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Pill
                solid
                external
                href={googleCalendarLink(booked.start, booked.end, site.name, detailsText)}
              >
                Add to Google Calendar
              </Pill>
              <Pill
                href={icsFile(booked.start, booked.end, site.name, detailsText, site.url)}
                download={`${site.name.toLowerCase()}-call.ics`}
              >
                Apple / Outlook calendar
              </Pill>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-7">
              {/* A full page load on purpose (not <Link>), so the home page plays its intro. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/" className="link-sweep pb-1 text-[0.9375rem] font-medium text-bone">
                See the main site
              </a>
              <a
                href={mailto(
                  `Change my call on ${longDay(booked.start, HOME_ZONE)}`,
                  fallbackBody(booked.start),
                )}
                className="link-sweep pb-1 text-[0.9375rem] font-medium text-bone-dim hover:text-bone"
              >
                Need to change it? Email us
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------------------------------------- Booking isn't available */
  if (load === "unavailable" || (load === "ready" && days.length === 0) || status === "error") {
    const empty = load === "ready" && days.length === 0 && status !== "error";
    return (
      <motion.div
        role="status"
        className={cn(CARD, "p-6 md:p-10 lg:p-14")}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: ease.expo }}
      >
        {EDGE}
        <div className="relative max-w-2xl">
          <p className="label text-ember">
            {status === "error" ? "That didn't go through" : empty ? "All booked up" : "Booking is offline"}
          </p>
          <h2 className="display mt-5 text-[clamp(2rem,4.4vw,3.5rem)] text-bone">
            {status === "error"
              ? "We couldn't book that."
              : empty
                ? "No free times right now."
                : "Let's do it by email."}
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-bone-dim">
            {status === "error"
              ? "It's us, not you. Everything you typed is still here: try again, or email us the time and we'll lock it in."
              : empty
                ? "Every time we have is taken. Email us a few times that suit you and we'll make one work."
                : "Online booking isn't working just now. Email us a couple of times that suit you and we'll lock one in."}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Pill solid href={mailto(`Booking a ${CALL_MINUTES}-minute call`, fallbackBody(chosen))}>
              Email {site.email}
            </Pill>
            {status === "error" ? (
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="inline-flex h-12 items-center whitespace-nowrap rounded-full border border-white/20 px-6 text-[0.9375rem] font-semibold text-bone transition-colors duration-300 hover:border-white/50"
              >
                Try again
              </button>
            ) : (
              <Pill href="/">See the main site</Pill>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ------------------------------------------------------- Pick and book */
  const ready = load === "ready" && zone !== null && current !== null;
  const zoneNote =
    ready && current
      ? sameClockAsHome(current.times[0], zone)
        ? `Sydney time (${zoneName(current.times[0], HOME_ZONE)})`
        : `Your time: ${zoneLabel(zone, current.times[0])}`
      : "";
  const showBar = isClient && step === "pick" && Boolean(chosen) && ready;

  return (
    <>
      {/* It rises in with a CSS animation (globals.css, .book-rise), so it is on screen from the
          first paint rather than after the scripts arrive. */}
      <div ref={panelRef} className={cn(CARD, "book-rise scroll-mt-28 [animation-delay:240ms]")}>
        {EDGE}
        <div className="relative grid grid-cols-1 lg:grid-cols-[minmax(15rem,0.9fr)_minmax(0,2.4fr)]">
          <aside className="min-w-0 border-b border-white/10 p-6 md:p-10 lg:border-b-0 lg:border-r xl:p-12">
            <CallInfo
              zone={zone}
              own={own}
              at={at}
              onZone={changeZone}
              chosen={step === "details" ? chosen : null}
              onChange={() => setStep("pick")}
              compact={step === "details" && Boolean(chosen)}
            />
          </aside>

          <div className="relative min-w-0">
            <AnimatePresence mode="wait" initial={false}>
              {step === "pick" ? (
                <motion.div
                  key="pick"
                  className="grid grid-cols-1 md:grid-cols-[minmax(0,1.55fr)_minmax(13.5rem,1fr)]"
                  initial={{ opacity: 0, x: -28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -28 }}
                  transition={{ duration: 0.4, ease: ease.expo }}
                  aria-busy={!ready}
                >
                  {/* The calendar */}
                  <div className="min-w-0 p-6 md:border-r md:border-white/10 md:p-10 xl:p-12">
                    {ready ? (
                      <MonthCalendar
                        month={shownMonth}
                        first={first}
                        last={last}
                        free={free}
                        selected={current?.key ?? null}
                        today={today}
                        onMonth={setMonth}
                        onPick={pickDay}
                      />
                    ) : (
                      <div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-8 w-44 rounded-full" />
                          <div className="flex gap-2">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <Skeleton className="h-11 w-11 rounded-full" />
                          </div>
                        </div>
                        <div className="mt-[3.4rem] grid grid-cols-7 gap-1.5">
                          {Array.from({ length: 35 }, (_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-2xl" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* The times on the chosen day */}
                  <div
                    ref={timesRef}
                    className="min-w-0 scroll-mt-28 border-t border-white/10 p-6 md:border-t-0 md:p-8 xl:p-10"
                  >
                    {ready && current ? (
                      <>
                        <p className="label text-mute">{dayParts(current.times[0], zone).weekday}</p>
                        <h3 className="display mt-2 flex items-baseline gap-[0.3em] text-[1.5rem] text-bone">
                          <span>{dayParts(current.times[0], zone).day}</span>
                          <span>{longDay(current.times[0], zone).split(" ").slice(2).join(" ")}</span>
                        </h3>
                        <p className="label mt-3 text-faint">{zoneNote}</p>
                        <div aria-live="polite">
                          {taken || lost ? (
                            <p className="mt-5 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-[0.9375rem] text-bone">
                              Someone just grabbed that time. Here&rsquo;s what&rsquo;s still free.
                            </p>
                          ) : null}
                        </div>
                        {/* Morning, afternoon and evening (in the visitor's own clock), so a long day is easy to scan. */}
                        <div
                          key={current.key}
                          data-testid="times"
                          className="mt-6 md:-mx-1 md:max-h-[27rem] md:overflow-y-auto md:px-1 md:pb-3 md:pt-1 md:[mask-image:linear-gradient(to_bottom,transparent,#000_0.6rem,#000_calc(100%-1.5rem),transparent)]"
                        >
                          {timeGroups.map((g, gi) => (
                            <div key={g.label} className={cn(gi > 0 && "mt-7")}>
                              <p className="label mb-3 text-faint">{g.label}</p>
                              <ul
                                aria-label={`${g.label} times on ${longDay(current.times[0], zone)}`}
                                className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-1"
                              >
                                {g.times.map((t, i) => {
                                  const on = t === chosen;
                                  return (
                                    <motion.li
                                      key={t}
                                      className="flex"
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{
                                        duration: 0.4,
                                        ease: ease.expo,
                                        delay: Math.min(g.from + i, 14) * 0.02,
                                      }}
                                    >
                                      <button
                                        type="button"
                                        data-time={t}
                                        aria-pressed={on}
                                        onClick={() => pickTime(t)}
                                        className={cn(
                                          "h-12 min-w-0 flex-1 rounded-full border font-mono text-[0.875rem] tabular-nums transition-[background-color,border-color,color,transform] duration-300 active:scale-95 md:text-[0.9375rem]",
                                          on
                                            ? "border-ember bg-ember text-ink md:border-white/25 md:bg-white/[0.08] md:text-bone"
                                            : "border-white/12 text-bone hover:border-ember hover:text-ember-soft",
                                        )}
                                      >
                                        {clock(t, zone)}
                                      </button>
                                      {on ? (
                                        <button
                                          type="button"
                                          onClick={() => setStep("details")}
                                          className="book-next ml-2 hidden h-12 flex-1 items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-ember font-semibold text-ink transition-colors duration-300 hover:bg-bone md:flex"
                                        >
                                          Next <ArrowIcon dir="right" className="h-4 w-4" />
                                        </button>
                                      ) : null}
                                    </motion.li>
                                  );
                                })}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div>
                        <Skeleton className="h-3 w-20 rounded-full" />
                        <Skeleton className="mt-3 h-7 w-40 rounded-full" />
                        <div className="mt-8 grid grid-cols-3 gap-2 md:grid-cols-1">
                          {Array.from({ length: 6 }, (_, i) => (
                            <Skeleton key={i} className="h-12 rounded-full" />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="details"
                  noValidate
                  onSubmit={onSubmit}
                  aria-label="Your details"
                  className="grid content-start gap-9 p-6 md:p-10 xl:p-12"
                  initial={{ opacity: 0, x: 28 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 28 }}
                  transition={{ duration: 0.4, ease: ease.expo }}
                >
                  <button
                    type="button"
                    onClick={() => setStep("pick")}
                    className="group -ml-1 flex h-10 w-fit items-center gap-2 rounded-full pl-1 pr-3 text-[0.9375rem] font-medium text-bone-dim transition-colors hover:text-bone"
                  >
                    <ArrowIcon
                      dir="left"
                      className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5"
                    />
                    Back
                  </button>
                  <div>
                    <h2
                      ref={headingRef}
                      tabIndex={-1}
                      className="display text-[clamp(2rem,3.4vw,3rem)] text-bone outline-none"
                    >
                      Who do we <span className="accent">call?</span>
                    </h2>
                    {chosen && zone ? (
                      <p className="mt-3 text-[1.0625rem] text-bone-dim">
                        We&rsquo;ll ring you on {longDay(chosen, zone)} at {clock(chosen, zone)}. Just a name
                        and a number.
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-9 sm:grid-cols-2 sm:gap-8">
                    <Field
                      label="Your name"
                      name="name"
                      value={details.name}
                      onChange={(v) => set("name", v)}
                      error={errors.name}
                      autoComplete="name"
                      maxLength={BOOKING_LIMITS.name}
                      placeholder="Alex Citizen"
                    />
                    <Field
                      label="Phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      value={details.phone}
                      onChange={(v) => set("phone", v)}
                      error={errors.phone}
                      autoComplete="tel"
                      maxLength={BOOKING_LIMITS.phone}
                      placeholder="04xx xxx xxx"
                    />
                  </div>
                  <Field
                    label="Business"
                    name="business"
                    value={details.business}
                    onChange={(v) => set("business", v)}
                    optional
                    autoComplete="organization"
                    maxLength={BOOKING_LIMITS.business}
                    placeholder="What's it called?"
                  />
                  <Field
                    label="What's it about?"
                    name="message"
                    value={details.message}
                    onChange={(v) => set("message", v)}
                    optional
                    multiline
                    maxLength={BOOKING_LIMITS.message}
                    placeholder="A new website, more people finding you, Instagram, a custom tool…"
                  />

                  {/* Honeypot. Hidden from people and from assistive tech; bots tend to fill it in. */}
                  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                    <label>
                      Leave this field empty
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col-reverse items-start justify-between gap-5 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
                    <p className="max-w-[17rem] text-[0.8125rem] leading-relaxed text-faint">
                      We only use these details to set up the call.
                    </p>
                    <Magnetic strength={0.2} className="w-fit">
                      <button
                        type="submit"
                        disabled={status === "sending"}
                        className="group relative inline-flex h-16 items-center gap-5 overflow-hidden whitespace-nowrap rounded-full bg-ember pl-9 pr-3 text-lg font-semibold text-ink disabled:cursor-wait"
                      >
                        <span className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100 group-focus-visible:scale-y-100" />
                        <span className="relative">{status === "sending" ? "Booking" : "Book the call"}</span>
                        <span className="relative grid h-11 w-11 place-items-center rounded-full bg-ink text-bone">
                          {status === "sending" ? (
                            <motion.span
                              className="block h-4 w-4 rounded-full border-2 border-bone/30 border-t-bone"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 0.8, ease: "linear", repeat: Infinity }}
                            />
                          ) : (
                            <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                              <path
                                d="M2 12 12 2M4.5 2H12v7.5"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="square"
                              />
                            </svg>
                          )}
                        </span>
                      </button>
                    </Magnetic>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* On a phone, the chosen time and "Next" wait at the bottom of the screen. (Kept outside the
          panel, whose entrance animation would otherwise pin it to the panel instead of the screen.) */}
      {isClient
        ? createPortal(
            <AnimatePresence>
              {showBar && chosen && zone ? (
                <motion.div
                  key="bar"
                  data-testid="next-bar"
                  className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur-md md:hidden"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "110%" }}
                  transition={{ duration: 0.5, ease: ease.expo }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="min-w-0 leading-snug">
                      <span className="label block text-mute">{CALL_MINUTES}-minute call</span>
                      <span className="mt-1 block truncate text-bone">
                        {(({ weekday, day, month }) => `${weekday} ${day} ${month}`)(dayParts(chosen, zone))},{" "}
                        {clock(chosen, zone)}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep("details")}
                      className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-ember px-6 font-semibold text-ink"
                    >
                      Next <ArrowIcon dir="right" className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
