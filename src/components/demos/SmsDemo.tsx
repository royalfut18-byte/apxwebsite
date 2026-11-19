"use client";

import { motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// 0 writing the message · 1 pressing send · 2 going out · 3 all delivered, hold
const STEPS = [3300, 700, 2600, 2600] as const;
const MESSAGE = "Hi {first_name}, we've had a spot open up this Thursday. Reply YES and it's yours.";
const RECIPIENTS = ["318", "902", "455", "127", "640"];
const TOTAL = 248;

/** A bulk SMS tool: write once, send to the whole list, watch them deliver. */
export function SmsDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the end state.
  const step = reduced ? 3 : running;
  const typed = useTypewriter(MESSAGE, playing && step === 0, step === 0 ? "typing" : "done", 34);
  const message = step === 0 ? typed : MESSAGE;

  const sending = step === 2;
  const done = step === 3;
  const pressed = step === 1;

  // Render the merge field as a chip, once it has been fully typed.
  const [before, after] = message.split("{first_name}");
  const hasChip = message.includes("{first_name}");

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mx-auto grid h-full w-full max-w-[34rem] content-center gap-3 sm:grid-cols-[1.25fr_1fr]"
    >
      {/* Compose */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-faint">New campaign</span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium text-bone-dim">
            <span className="h-1.5 w-1.5 rounded-full bg-ember" />
            All customers
          </span>
        </div>

        <div className="min-h-[5.75rem] flex-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-[12.5px] leading-relaxed text-bone">
          {hasChip ? (
            <>
              {before}
              <span className="rounded bg-ember/20 px-1 py-px font-mono text-[11px] text-ember-soft">
                first_name
              </span>
              {after}
            </>
          ) : (
            message
          )}
          {step === 0 && <span className="caret ml-px inline-block h-3.5 w-px translate-y-0.5 bg-ember" />}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] tabular-nums text-faint">{message.length}/160</span>
          <motion.span
            className={cn(
              "flex h-8 items-center gap-2 rounded-full px-3.5 text-[11px] font-semibold",
              done ? "bg-white/10 text-bone" : "bg-ember text-ink",
            )}
            initial={false}
            animate={{ scale: pressed ? 0.93 : 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
          >
            {done ? "Sent" : sending ? "Sending" : `Send to ${TOTAL}`}
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
              {done ? (
                <path d="m2 6.4 2.6 2.6L10 3.4" stroke="currentColor" strokeWidth="1.7" />
              ) : (
                <path d="M2 6h8M6.5 2.5 10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.7" />
              )}
            </svg>
          </motion.span>
        </div>
      </div>

      {/* Delivery */}
      <div className="flex flex-col rounded-2xl border border-white/10 bg-ink-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="label text-faint">Delivery</span>
          <span className="font-mono text-[10px] tabular-nums text-bone-dim">
            {done ? TOTAL : sending ? "..." : 0}/{TOTAL}
          </span>
        </div>

        <ul className="flex flex-1 flex-col justify-center gap-1.5">
          {RECIPIENTS.map((tail, i) => {
            const shown = sending || done;
            const delay = sending ? 0.25 + i * 0.36 : 0;
            return (
              <li
                key={tail}
                className="relative flex items-center justify-between rounded-lg bg-white/[0.035] px-2.5 py-1.5"
              >
                {/* Waiting: a blank bar. Sent: the (masked) number fades in over it. */}
                <motion.span
                  className="absolute left-2.5 top-1/2 block h-1.5 w-20 -translate-y-1/2 rounded-full bg-white/10"
                  initial={false}
                  animate={{ opacity: shown ? 0 : 1 }}
                  transition={{ duration: 0.3, delay }}
                />
                <motion.span
                  className="font-mono text-[10px] tracking-wide text-bone-dim"
                  initial={false}
                  animate={{ opacity: shown ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: ease.expo, delay }}
                >
                  04&bull;&bull; &bull;&bull;&bull; {tail}
                </motion.span>
                <motion.span
                  className="grid h-3.5 w-3.5 place-items-center rounded-full bg-ember"
                  initial={false}
                  animate={shown ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 20,
                    delay: sending ? 0.45 + i * 0.36 : 0,
                  }}
                >
                  <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none">
                    <path d="m2 5.2 2 2 4-4.4" stroke="#070708" strokeWidth="1.7" />
                  </svg>
                </motion.span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[0.08]">
          <motion.div
            className="h-full origin-left rounded-full bg-ember"
            initial={false}
            animate={{ scaleX: done ? 1 : sending ? 0.94 : 0 }}
            transition={{
              duration: sending ? 2.4 : done ? 0.3 : 0.4,
              ease: sending ? ease.quart : "easeOut",
            }}
          />
        </div>
      </div>
    </div>
  );
}
