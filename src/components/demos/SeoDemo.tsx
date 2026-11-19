"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// 0 typing the search · 1-3 climbing a place at a time · 4 hold at the top
const STEPS = [1900, 950, 950, 1100, 2600] as const;
const QUERY = "near me, open now";
const RIVALS = ["a", "b", "c"] as const;

const spring = { type: "spring", stiffness: 260, damping: 30, mass: 0.9 } as const;

/** A local search, with your listing working its way from fourth to first. */
export function SeoDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the end state.
  const step = reduced ? 4 : running;
  const typed = useTypewriter(QUERY, playing && step === 0, step === 0 ? "typing" : "done", 62);
  const query = step === 0 ? typed : QUERY;

  // Your position, 0-based: 3 (fourth) at the start, 0 (first) by step 3.
  const position = Math.max(0, 3 - Math.max(0, step));
  const rows: Array<(typeof RIVALS)[number] | "you"> = [...RIVALS];
  rows.splice(position, 0, "you");
  const top = position === 0;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative mx-auto flex h-full w-full max-w-[30rem] flex-col justify-center gap-3"
    >
      {/* Search bar */}
      <div className="flex h-11 items-center gap-3 rounded-full border border-white/10 bg-ink-900 px-4">
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-mute" fill="none">
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m10.5 10.5 3.5 3.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="truncate text-[13px] text-bone">
          <span className="text-mute">your trade </span>
          {query}
          {step === 0 && <span className="caret ml-px inline-block h-3.5 w-px translate-y-0.5 bg-ember" />}
        </span>
      </div>

      {/* Results */}
      <div className="relative flex flex-col gap-2">
        {rows.map((id, i) => {
          const you = id === "you";
          return (
            <motion.div
              key={id}
              layout
              transition={spring}
              style={{ borderRadius: 14 }}
              className={cn(
                "relative flex h-[3.25rem] items-center gap-3 border px-3.5",
                you ? "z-10 border-ember/60 bg-ember/[0.09]" : "border-white/[0.07] bg-white/[0.025]",
              )}
            >
              <motion.span
                layout="position"
                className={cn(
                  "w-5 shrink-0 font-mono text-[11px] tabular-nums",
                  you ? "font-semibold text-ember" : "text-faint",
                )}
              >
                {i + 1}
              </motion.span>

              {you ? (
                <>
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ember text-[11px] font-bold text-ink">
                    Y
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-tight text-bone">
                      Your business
                    </span>
                    <span className="block truncate font-mono text-[9.5px] leading-tight text-ember-soft">
                      yourbusiness.com.au
                    </span>
                  </span>
                  <AnimatePresence>
                    {top && (
                      <motion.span
                        key="badge"
                        className="shrink-0 rounded-full bg-ember px-2.5 py-1 text-[10px] font-bold leading-none text-ink"
                        initial={{ opacity: 0, scale: 0.4 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 480, damping: 20, delay: reduced ? 0 : 0.3 }}
                      >
                        Top spot
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <>
                  <span className="h-7 w-7 shrink-0 rounded-lg bg-white/[0.07]" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      className="block h-2 rounded-full bg-white/[0.14]"
                      style={{ width: id === "a" ? "62%" : id === "b" ? "48%" : "70%" }}
                    />
                    <span
                      className="block h-1.5 rounded-full bg-white/[0.07]"
                      style={{ width: id === "a" ? "38%" : id === "b" ? "44%" : "30%" }}
                    />
                  </span>
                </>
              )}

              {/* A soft pulse each time you move up a place */}
              {you && (
                <motion.span
                  key={`pulse-${position}`}
                  className="pointer-events-none absolute inset-0 rounded-[14px] border border-ember"
                  initial={{ opacity: 0.8, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.04 }}
                  transition={{ duration: 0.9, ease: ease.quart }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trend line underneath */}
      <div className="mt-1 flex items-center justify-between gap-4 px-1">
        <span className="label text-faint">Position</span>
        <svg viewBox="0 0 200 28" className="h-7 min-w-0 flex-1" fill="none" preserveAspectRatio="none">
          <path d="M0 24 H200" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
          <motion.path
            d="M2 23 C 30 23, 44 20, 62 18 S 96 15, 112 11 S 150 6, 198 3"
            stroke="var(--color-ember)"
            strokeWidth="1.75"
            strokeLinecap="round"
            initial={false}
            animate={{ pathLength: step === 0 ? 0.04 : ([0.3, 0.55, 0.8, 1][Math.min(step, 4) - 1] ?? 1) }}
            transition={{ duration: 0.9, ease: ease.quart }}
          />
        </svg>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-bone">#{position + 1}</span>
      </div>
    </div>
  );
}
