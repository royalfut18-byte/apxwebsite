"use client";

import { motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { useTypewriter } from "@/hooks/useTypewriter";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// 0 typing the search · 1-3 climbing a place at a time · 4 hold at the top
const STEPS = [1900, 950, 950, 1100, 2600] as const;
const QUERY = "near me, open now";
const RIVALS = ["a", "b", "c"] as const;
const WIDTHS: Record<(typeof RIVALS)[number], [string, string]> = {
  a: ["62%", "38%"],
  b: ["48%", "44%"],
  c: ["70%", "30%"],
};
/** Height of one result row plus the gap beneath it, in rem. */
const SLOT = 3.75;

/** The search being typed. Kept in its own component so each keystroke re-renders only this. */
function Query({ typing }: { typing: boolean }) {
  const typed = useTypewriter(QUERY, typing, typing ? "typing" : "done", 62);
  return (
    <span className="truncate text-[13px] text-bone">
      <span className="text-mute">your trade </span>
      {typing ? typed : QUERY}
      {typing && <span className="caret ml-px inline-block h-3.5 w-px translate-y-0.5 bg-ember" />}
    </span>
  );
}

/** A local search, with your listing working its way from fourth to first. */
export function SeoDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the end state.
  const step = reduced ? 4 : running;

  // Your position, 0-based: 3 (fourth) at the start, 0 (first) by step 3.
  const position = Math.max(0, 3 - Math.max(0, step));
  const order: Array<(typeof RIVALS)[number] | "you"> = [...RIVALS];
  order.splice(position, 0, "you");
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
        <Query typing={playing && step === 0} />
      </div>

      {/* Results. Every row is pinned to the top and slid into its slot, so a change of
          rank is a transform and nothing has to be laid out again. */}
      <div className="relative" style={{ height: `${SLOT * 4 - 0.5}rem` }}>
        {(["you", ...RIVALS] as const).map((id) => {
          const you = id === "you";
          const rank = order.indexOf(id);
          return (
            <motion.div
              key={id}
              className={cn(
                "absolute inset-x-0 top-0 flex h-[3.25rem] items-center gap-3 rounded-[14px] border px-3.5",
                you ? "z-10 border-ember/60 bg-[#1d110d]" : "border-white/[0.07] bg-[#131315]",
              )}
              initial={false}
              animate={{ transform: `translateY(${rank * SLOT}rem)` }}
              transition={{ duration: 0.7, ease: ease.expo }}
            >
              <span
                className={cn(
                  "w-5 shrink-0 font-mono text-[11px] tabular-nums",
                  you ? "font-semibold text-ember" : "text-faint",
                )}
              >
                {rank + 1}
              </span>

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
                  <motion.span
                    className="shrink-0 rounded-full bg-ember px-2.5 py-1 text-[10px] font-bold leading-none text-ink"
                    initial={false}
                    animate={
                      top ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.4)" }
                    }
                    transition={{ duration: 0.45, ease: ease.expo, delay: top && !reduced ? 0.35 : 0 }}
                  >
                    Top spot
                  </motion.span>
                  {/* A soft pulse each time you move up a place */}
                  <motion.span
                    key={`pulse-${position}`}
                    className="pointer-events-none absolute inset-0 rounded-[14px] border border-ember"
                    initial={{ opacity: 0.8, transform: "scale(1)" }}
                    animate={{ opacity: 0, transform: "scale(1.04)" }}
                    transition={{ duration: 0.9, ease: ease.quart }}
                  />
                </>
              ) : (
                <>
                  <span className="h-7 w-7 shrink-0 rounded-lg bg-white/[0.07]" />
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span
                      className="block h-2 rounded-full bg-white/[0.14]"
                      style={{ width: WIDTHS[id][0] }}
                    />
                    <span
                      className="block h-1.5 rounded-full bg-white/[0.07]"
                      style={{ width: WIDTHS[id][1] }}
                    />
                  </span>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Trend line underneath: revealed left to right with a clip, not redrawn. */}
      <div className="mt-1 flex items-center justify-between gap-4 px-1">
        <span className="label text-faint">Position</span>
        <div className="relative h-7 min-w-0 flex-1">
          <svg
            viewBox="0 0 200 28"
            className="absolute inset-0 h-full w-full"
            fill="none"
            preserveAspectRatio="none"
          >
            <path d="M0 24 H200" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 4" />
          </svg>
          <motion.svg
            viewBox="0 0 200 28"
            className="absolute inset-0 h-full w-full"
            fill="none"
            preserveAspectRatio="none"
            initial={false}
            animate={{ clipPath: `inset(0% ${[96, 70, 45, 20, 0][Math.min(step, 4)]}% 0% 0%)` }}
            transition={{ duration: 0.9, ease: ease.quart }}
          >
            <path
              d="M2 23 C 30 23, 44 20, 62 18 S 96 15, 112 11 S 150 6, 198 3"
              stroke="var(--color-ember)"
              strokeWidth="1.75"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </motion.svg>
        </div>
        <span className="font-mono text-[11px] font-semibold tabular-nums text-bone">#{position + 1}</span>
      </div>
    </div>
  );
}
