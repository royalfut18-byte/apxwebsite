"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  BOOKING_LIMITS,
  CALL_MINUTES,
  HOME_ZONE,
  cleanBooking,
  clock,
  dayParts,
  googleCalendarLink,
  groupByDay,
  hourOf,
  icsFile,
  longDay,
  sameClockAsHome,
  validateBooking,
  visitorZone,
  zoneCity,
  zoneName,
  type Booking,
  type BookingErrors,
} from "@/lib/booking";
import { cn, ease } from "@/lib/cn";
import { site } from "@/lib/site";

import { Magnetic } from "../ui/Magnetic";

type Details = Pick<Booking, "name" | "phone" | "business" | "message">;
type Status = "idle" | "sending" | "booked" | "error";

const EMPTY: Details = { name: "", phone: "", business: "", message: "" };
/** Times loaded longer ago than this are fetched again when the visitor comes back to the tab. */
const STALE_MS = 5 * 60_000;

const noop = () => () => {};

/** The free times from APECS (through this site's own server), or null when booking is unavailable. */
async function getFreeTimes(): Promise<string[] | null> {
  try {
    const response = await fetch("/api/book/slots", { cache: "no-store" });
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

function Step({ index, title, children }: { index: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 className="flex items-baseline gap-3">
        <span className="label text-ember">{index}</span>
        <span className="display text-[clamp(1.35rem,2vw,1.75rem)] text-bone">{title}</span>
      </h2>
      {children}
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

export function BookingPanel() {
  // The visitor's time zone is only known in the browser. Until then (and on the server) the
  // panel shows its loading state, which doesn't depend on it.
  const zone = useSyncExternalStore(noop, visitorZone, () => null);
  const reduced = useReducedMotion();
  const [slots, setSlots] = useState<string[]>([]);
  const [load, setLoad] = useState<"loading" | "ready" | "unavailable">("loading");
  const [day, setDay] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<BookingErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [taken, setTaken] = useState(false);
  const [booked, setBooked] = useState<{ start: string; end: string } | null>(null);
  const loadedAt = useRef(0);
  const timesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const apply = useCallback((free: string[] | null) => {
    if (!free) {
      setLoad("unavailable");
      return;
    }
    loadedAt.current = Date.now();
    setSlots(free);
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
      if (document.visibilityState !== "visible" || Date.now() - loadedAt.current < STALE_MS) return;
      getFreeTimes().then((free) => free && apply(free));
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [apply]);

  const days = useMemo(() => (zone ? groupByDay(slots, zone) : []), [slots, zone]);
  const current = days.find((d) => d.key === day) ?? days[0] ?? null;
  // A time that has gone (booked by someone else) is no longer chosen.
  const chosen = time && slots.includes(time) ? time : null;
  const lost = Boolean(time) && !chosen && load === "ready";

  const groups = useMemo(() => {
    if (!current || !zone) return [];
    const morning = current.times.filter((t) => hourOf(t, zone) < 12);
    const afternoon = current.times.filter((t) => hourOf(t, zone) >= 12);
    return [
      { label: "Morning", times: morning },
      { label: "Afternoon", times: afternoon },
    ].filter((g) => g.times.length > 0);
  }, [current, zone]);

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
    setErrors((prev) => ({ ...prev, start: undefined }));
    // On a phone the form is further down: bring it up once a time is chosen.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const form = formRef.current;
      if (form && form.getBoundingClientRect().top > window.innerHeight * 0.6) {
        form.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      }
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const booking = cleanBooking({ ...details, start: chosen ?? "", timeZone: zone ?? HOME_ZONE });
    const found = validateBooking(booking);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      if (found.start) {
        timesRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        return;
      }
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
        return;
      }
      if (response.status === 409) {
        // Someone got there first. Show what's still free, keep everything they typed.
        setStatus("idle");
        setTime(null);
        setTaken(true);
        getFreeTimes().then((free) => free && apply(free));
        timesRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
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

  const card =
    "relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-800 shadow-[0_40px_120px_-40px_rgba(255,91,46,0.35)] md:rounded-[2.25rem]";
  const edge = (
    <>
      {/* A line of the site's colours along the top edge, and a soft light under it (as on the contact form). */}
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

  /* ------------------------------------------------------------- Booked */
  if (status === "booked" && booked) {
    const zoneNow = zone ?? HOME_ZONE;
    const detailsText = `We'll ring you on ${details.phone.trim()}.\n\nNeed to change it? Email ${site.email}.`;
    return (
      <motion.div
        role="status"
        className={cn(card, "p-6 md:p-10 lg:p-14")}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: ease.expo }}
      >
        {edge}
        <div className="relative max-w-2xl">
          <svg viewBox="0 0 64 64" className="h-16 w-16 text-ember" fill="none" aria-hidden="true">
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
          <h2 className="display mt-8 text-[clamp(2.25rem,5vw,4rem)] text-bone">
            You&rsquo;re booked{firstName ? `, ${firstName}` : ""}.
          </h2>
          <p
            className="mt-6 text-[clamp(1.2rem,2vw,1.5rem)] font-medium leading-snug text-bone"
            data-testid="booked-when"
          >
            {longDay(booked.start, zoneNow)}, {clock(booked.start, zoneNow)}
            <span className="text-bone-dim">
              {" "}
              {sameClockAsHome(booked.start, zoneNow)
                ? `(${zoneName(booked.start, HOME_ZONE)}, Sydney time)`
                : `your time (${clock(booked.start, HOME_ZONE)} in Sydney)`}
            </span>
          </p>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-bone-dim">
            We&rsquo;ll ring you on <span className="text-bone">{details.phone.trim()}</span> for a quick{" "}
            {CALL_MINUTES}-minute chat. No prep needed: just tell us about your business.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Pill solid external href={googleCalendarLink(booked.start, booked.end, site.name, detailsText)}>
              Add to Google Calendar
            </Pill>
            <Pill
              href={icsFile(booked.start, booked.end, site.name, detailsText, site.url)}
              download={`${site.name.toLowerCase()}-call.ics`}
            >
              Apple / Outlook calendar
            </Pill>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-7">
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
      </motion.div>
    );
  }

  /* ---------------------------------------------- Booking isn't available */
  if (load === "unavailable" || (load === "ready" && days.length === 0) || status === "error") {
    const empty = load === "ready" && days.length === 0 && status !== "error";
    return (
      <motion.div
        role="status"
        className={cn(card, "p-6 md:p-10 lg:p-14")}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: ease.expo }}
      >
        {edge}
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
                ? "Every time in the next two weeks is taken. Email us a few times that suit you and we'll make one work."
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
      ? zone === HOME_ZONE || sameClockAsHome(current.times[0], zone)
        ? `Sydney time (${zoneName(current.times[0], HOME_ZONE)})`
        : `Your time: ${zoneCity(zone)} (${zoneName(current.times[0], zone)})`
      : "";

  return (
    // It rises in with a CSS animation (globals.css, .book-rise), so it is on screen from the
    // first paint rather than after the scripts arrive.
    <div className={cn(card, "book-rise [animation-delay:240ms]")}>
      {edge}
      {/* grid-cols-1 and min-w-0: the row of days scrolls sideways instead of widening the panel. */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12">
        {/* 1 and 2: the day, then the time */}
        <div
          className="min-w-0 p-6 md:p-10 lg:col-span-7 lg:border-r lg:border-white/10 xl:p-12"
          aria-busy={!ready}
        >
          <Step index="01" title="Pick a day" />
          {ready ? (
            <motion.div
              layoutScroll
              role="group"
              aria-label="Days with free times"
              className="-mx-6 mt-5 flex snap-x scroll-px-6 gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            >
              {days.map((d) => {
                const on = d.key === current?.key;
                const p = dayParts(d.times[0], zone!);
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${longDay(d.times[0], zone!)}, ${d.times.length} free ${d.times.length === 1 ? "time" : "times"}`}
                    onClick={() => pickDay(d.key)}
                    className={cn(
                      "relative flex h-[5.25rem] w-[4.6rem] shrink-0 snap-start flex-col items-center justify-center rounded-2xl border transition-[border-color,color] duration-300 sm:w-auto",
                      on
                        ? "border-ember text-ink"
                        : "border-white/10 text-bone-dim hover:border-white/30 hover:text-bone",
                    )}
                  >
                    {on ? (
                      <motion.span
                        layoutId="day-on"
                        aria-hidden="true"
                        className="absolute -inset-px rounded-2xl bg-ember"
                        transition={{ type: "spring", stiffness: 480, damping: 38 }}
                      />
                    ) : null}
                    <span className={cn("label relative", on ? "text-ink/70" : "text-mute")}>
                      {p.weekday}
                    </span>
                    <span className="display relative mt-1 text-[1.75rem] leading-none">{p.day}</span>
                    <span
                      className={cn(
                        "relative mt-1 text-[0.75rem] font-medium",
                        on ? "text-ink/70" : "text-faint",
                      )}
                    >
                      {p.month}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          ) : (
            <div className="mt-5 flex gap-2 overflow-hidden sm:grid sm:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-[5.25rem] w-[4.6rem] shrink-0 rounded-2xl sm:w-auto" />
              ))}
            </div>
          )}

          <div ref={timesRef} className="mt-10 scroll-mt-28">
            <Step index="02" title="Pick a time">
              {zoneNote ? <p className="label text-mute">{zoneNote}</p> : null}
            </Step>
            <div aria-live="polite" className="min-h-0">
              {taken || lost ? (
                <p className="mt-4 rounded-2xl border border-ember/40 bg-ember/10 px-4 py-3 text-[0.9375rem] text-bone">
                  Someone just grabbed that time. Here&rsquo;s what&rsquo;s still free.
                </p>
              ) : errors.start ? (
                <p role="alert" className="mt-4 text-[0.9375rem] font-medium text-ember">
                  {errors.start}
                </p>
              ) : null}
            </div>
            {ready && current ? (
              <motion.div
                key={current.key}
                className="mt-5 grid gap-7"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: ease.expo }}
              >
                <p className="text-[0.9375rem] text-bone-dim">{longDay(current.times[0], zone!)}</p>
                {groups.map((g) => (
                  <div key={g.label} role="group" aria-label={g.label}>
                    <p className="label text-faint">{g.label}</p>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {g.times.map((t) => {
                        const on = t === chosen;
                        return (
                          <button
                            key={t}
                            type="button"
                            aria-pressed={on}
                            onClick={() => pickTime(t)}
                            className={cn(
                              "h-12 rounded-full border font-mono text-[0.875rem] tabular-nums transition-[background-color,border-color,color,transform] duration-300 active:scale-95",
                              on
                                ? "border-ember bg-ember text-ink"
                                : "border-white/12 text-bone hover:border-white/40",
                            )}
                          >
                            {clock(t, zone!)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-12 rounded-full" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 3: who to call */}
        <form
          ref={formRef}
          noValidate
          onSubmit={onSubmit}
          aria-label="Your details"
          className="grid min-w-0 scroll-mt-24 content-start gap-9 border-t border-white/10 p-6 md:p-10 lg:col-span-5 lg:border-t-0 xl:p-12"
        >
          <Step index="03" title="Your details" />
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

          <div className="grid gap-5 border-t border-white/10 pt-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={chosen ?? "none"}
                className={cn("text-[1.0625rem] leading-snug", chosen ? "text-bone" : "text-faint")}
                data-testid="booking-summary"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
              >
                {chosen && zone ? (
                  <>
                    <span className="label mb-1.5 block text-mute">{CALL_MINUTES}-minute call</span>
                    {longDay(chosen, zone)}, {clock(chosen, zone)}
                    {sameClockAsHome(chosen, zone) ? null : (
                      <span className="text-bone-dim"> your time ({clock(chosen, HOME_ZONE)} in Sydney)</span>
                    )}
                  </>
                ) : (
                  "Pick a day and a time, then we'll ring you then."
                )}
              </motion.p>
            </AnimatePresence>
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
            <p className="text-[0.8125rem] leading-relaxed text-faint">
              We only use these details to set up the call.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
