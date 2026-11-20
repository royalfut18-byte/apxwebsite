"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";

import { cn, ease } from "@/lib/cn";
import {
  cleanEnquiry,
  enquirySubject,
  enquiryText,
  LIMITS,
  NEEDS,
  validateEnquiry,
  type Enquiry,
  type EnquiryErrors,
} from "@/lib/contact";
import { site } from "@/lib/site";

import { Magnetic } from "../ui/Magnetic";
import { Reveal } from "../ui/Reveal";

type Status = "idle" | "sending" | "sent" | "mailto" | "error";

const EMPTY: Enquiry = { name: "", email: "", business: "", needs: [], message: "" };

function mailtoFor(enquiry: Enquiry) {
  return `mailto:${site.email}?subject=${encodeURIComponent(enquirySubject(enquiry))}&body=${encodeURIComponent(enquiryText(enquiry))}`;
}

type FieldProps = {
  label: string;
  name: keyof Pick<Enquiry, "name" | "email" | "business" | "message">;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  optional?: boolean;
  type?: string;
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
      "peer w-full border-0 border-b bg-transparent pb-3 pt-2 text-lg text-bone outline-none transition-colors duration-300 placeholder:text-faint md:text-xl",
      error ? "border-ember" : "border-white/20 hover:border-white/40 focus:border-bone",
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
          rows={4}
          className={cn(shared.className, "resize-none leading-relaxed")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input {...shared} type={type} onChange={(e) => onChange(e.target.value)} />
      )}
      {/* Ember underline that wipes in on focus */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-ember transition-transform duration-500 ease-[var(--ease-expo)] peer-focus:scale-x-100",
          multiline && "bottom-[6px]",
        )}
      />
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

export function ContactForm() {
  const [enquiry, setEnquiry] = useState<Enquiry>(EMPTY);
  const [website, setWebsite] = useState(""); // honeypot
  const [errors, setErrors] = useState<EnquiryErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof Enquiry>(key: K, value: Enquiry[K]) => {
    setEnquiry((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleNeed = (need: string) =>
    set(
      "needs",
      enquiry.needs.includes(need) ? enquiry.needs.filter((n) => n !== need) : [...enquiry.needs, need],
    );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    const clean = cleanEnquiry(enquiry);
    const found = validateEnquiry(clean);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Send focus to the first problem.
      const first = (["name", "email", "message"] as const).find((k) => found[k]);
      if (first) event.currentTarget.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...clean, website }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        fallback?: string;
        fields?: EnquiryErrors;
      };
      if (response.ok && data.ok) {
        setStatus("sent");
        return;
      }
      if (response.status === 422 && data.fields) {
        setErrors(data.fields);
        setStatus("idle");
        return;
      }
      if (data.fallback === "mailto") {
        // No mail service behind the form: hand the message to the visitor's own mail app.
        window.location.href = mailtoFor(clean);
        setStatus("mailto");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be unavailable; the address is on screen either way.
    }
  }

  function reset() {
    setEnquiry(EMPTY);
    setErrors({});
    setStatus("idle");
  }

  const finished = status === "sent" || status === "mailto" || status === "error";
  const firstName = enquiry.name.trim().split(/\s+/)[0];

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-ink-800/95 p-6 md:rounded-[2.25rem] md:p-10 lg:p-12">
      <AnimatePresence mode="wait" initial={false}>
        {finished ? (
          <motion.div
            key="done"
            role="status"
            className="flex min-h-[30rem] flex-col justify-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.7, ease: ease.expo }}
          >
            {status === "sent" ? (
              <>
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
                <h3 className="display mt-8 text-[clamp(2rem,4vw,3.25rem)] text-bone">
                  Got it{firstName ? `, ${firstName}` : ""}.
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-bone-dim">
                  Your message is on its way to us. We&rsquo;ll read it properly and come back to you at{" "}
                  <span className="text-bone">{enquiry.email}</span>.
                </p>
              </>
            ) : status === "mailto" ? (
              <>
                <p className="label text-ember">One more step</p>
                <h3 className="display mt-5 text-[clamp(2rem,4vw,3.25rem)] text-bone">
                  Hit send in your mail app.
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-bone-dim">
                  We&rsquo;ve opened an email with everything you wrote, ready to go. If nothing opened, send
                  it straight to us instead.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href={mailtoFor(cleanEnquiry(enquiry))}
                    className="inline-flex h-12 items-center whitespace-nowrap rounded-full bg-bone px-6 text-[0.9375rem] font-semibold text-ink transition-colors duration-300 hover:bg-ember"
                  >
                    Open it again
                  </a>
                  <button
                    type="button"
                    onClick={copyEmail}
                    className="inline-flex h-12 items-center whitespace-nowrap rounded-full border border-white/20 px-6 text-[0.9375rem] font-semibold text-bone transition-colors duration-300 hover:border-white/50"
                  >
                    {copied ? "Copied" : "Copy our email address"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="label text-ember">That didn&rsquo;t send</p>
                <h3 className="display mt-5 text-[clamp(2rem,4vw,3.25rem)] text-bone">
                  Something went wrong.
                </h3>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-bone-dim">
                  It&rsquo;s us, not you. Your message is still here. Try again, or email us directly at{" "}
                  <a
                    href={mailtoFor(cleanEnquiry(enquiry))}
                    className="text-bone underline decoration-ember underline-offset-4"
                  >
                    {site.email}
                  </a>
                  .
                </p>
              </>
            )}

            <button
              type="button"
              onClick={status === "error" ? () => setStatus("idle") : reset}
              className="link-sweep mt-10 w-fit pb-1 text-[0.9375rem] font-medium text-bone-dim hover:text-bone"
            >
              {status === "error" ? "Back to the form" : "Send another message"}
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            noValidate
            onSubmit={onSubmit}
            // Without scripts the browser falls back to handing the fields to the visitor's mail app.
            action={`mailto:${site.email}`}
            method="post"
            encType="text/plain"
            aria-label="Start a project"
            className="grid gap-9"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: ease.expo }}
          >
            {/* The rows arrive one after another. */}
            <Reveal y={22} delay={0.15} className="grid gap-9 sm:grid-cols-2 sm:gap-8">
              <Field
                label="Your name"
                name="name"
                value={enquiry.name}
                onChange={(v) => set("name", v)}
                error={errors.name}
                autoComplete="name"
                maxLength={LIMITS.name}
                placeholder="Alex Citizen"
              />
              <Field
                label="Email"
                name="email"
                type="email"
                value={enquiry.email}
                onChange={(v) => set("email", v)}
                error={errors.email}
                autoComplete="email"
                maxLength={LIMITS.email}
                placeholder="alex@yourbusiness.com.au"
              />
            </Reveal>

            <Reveal y={22} delay={0.23}>
              <Field
                label="Business"
                name="business"
                value={enquiry.business}
                onChange={(v) => set("business", v)}
                optional
                autoComplete="organization"
                maxLength={LIMITS.business}
                placeholder="What's it called?"
              />
            </Reveal>

            <Reveal y={22} delay={0.31}>
              <fieldset>
                <legend className="label text-mute">What do you need?</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                  {NEEDS.map((need) => {
                    const on = enquiry.needs.includes(need);
                    return (
                      <button
                        key={need}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleNeed(need)}
                        className={cn(
                          "h-11 rounded-full border px-5 text-[0.9375rem] font-medium transition-[background-color,border-color,color,transform] duration-300 active:scale-95",
                          on
                            ? "border-ember bg-ember text-ink"
                            : "border-white/15 text-bone-dim hover:border-white/40 hover:text-bone",
                        )}
                      >
                        {need}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </Reveal>

            <Reveal y={22} delay={0.39}>
              <Field
                label="Tell us about it"
                name="message"
                value={enquiry.message}
                onChange={(v) => set("message", v)}
                error={errors.message}
                maxLength={LIMITS.message}
                multiline
                placeholder="What does the business do, and what would a win look like?"
              />
            </Reveal>

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

            <Reveal
              y={22}
              delay={0.47}
              className="flex flex-col-reverse items-start justify-between gap-5 pt-2 sm:flex-row sm:items-center"
            >
              <p className="max-w-[17rem] text-[0.8125rem] leading-relaxed text-faint">
                We only use these details to reply to you.
              </p>
              <Magnetic strength={0.2}>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="group relative inline-flex h-16 items-center gap-5 overflow-hidden whitespace-nowrap rounded-full bg-ember pl-9 pr-3 text-lg font-semibold text-ink disabled:cursor-wait"
                >
                  <span className="absolute inset-0 origin-bottom scale-y-0 bg-bone transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100 group-focus-visible:scale-y-100" />
                  <span className="relative">{status === "sending" ? "Sending" : "Send it"}</span>
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
            </Reveal>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
