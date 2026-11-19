"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { ease } from "@/lib/cn";

import { Logo } from "./Logo";
import { useIntro } from "./providers/IntroProvider";

/**
 * The opening sequence.
 *
 * Four words (what APX does) flick past while a counter climbs, the wordmark draws
 * itself on, then two curtains lift: ink first, with a band of ember behind it,
 * like first light. The wordmark does not fade out. It flies up into the header and
 * becomes the logo (it shares a `layoutId` with the one in <Nav />).
 *
 * Returning visitors in the same tab get a short version: wordmark, then lift.
 */

const WORDS = ["Websites", "SEO", "Instagram", "Tools"];
const WORD_MS = 340;
const START_MS = 180;
const LOGO_DRAW_MS = 980;
const HOLD_MS = 260;
const SEEN_KEY = "apx:intro";

// The curtain's bottom edge. At rest it hangs below the screen in a curve; as the
// curtain lifts the curve flattens, so the middle appears to trail behind.
const HANG = "M0 0 H100 V100 Q50 132 0 100 Z";
const FLAT = "M0 0 H100 V100 Q50 100 0 100 Z";

export function Intro() {
  const { phase, skipped, setPhase } = useIntro();
  const [step, setStep] = useState(-1);
  // Read once and remembered, so a development double-mount cannot flip it.
  const seenBefore = useRef<boolean | null>(null);
  const count = useMotionValue(0);
  const digits = useTransform(count, (v) => String(Math.round(v)).padStart(3, "0"));
  const bar = useTransform(count, (v) => v / 100);

  useEffect(() => {
    if (phase !== "intro") return;

    if (seenBefore.current === null) {
      seenBefore.current = false;
      try {
        seenBefore.current = window.sessionStorage.getItem(SEEN_KEY) === "1";
        window.sessionStorage.setItem(SEEN_KEY, "1");
      } catch {
        // Storage can be blocked. The full intro is a fine fallback.
      }
    }
    const seen = seenBefore.current;

    const timers: number[] = [];
    const wordsEnd = seen ? 120 : START_MS + WORDS.length * WORD_MS;
    const revealAt = wordsEnd + LOGO_DRAW_MS + HOLD_MS;

    if (!seen) {
      WORDS.forEach((_, i) => {
        timers.push(window.setTimeout(() => setStep(i), START_MS + i * WORD_MS));
      });
    }
    timers.push(window.setTimeout(() => setStep(WORDS.length), wordsEnd));
    timers.push(window.setTimeout(() => setPhase("reveal"), revealAt));

    const counter = animate(count, 100, {
      duration: (revealAt - 80) / 1000,
      ease: ease.inOut,
    });

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      counter.stop();
    };
    // Runs once: the sequence is fixed from the moment the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showLogo = phase === "intro" && step >= WORDS.length;

  // Bypassed (reduced motion, or a deep link): no curtain call, just get out of the way.
  if (skipped) return null;

  return (
    <>
      <AnimatePresence onExitComplete={() => setPhase("done")}>
        {phase === "intro" && (
          <motion.div
            key="intro"
            className="intro-root pointer-events-auto fixed inset-0 z-50"
            role="status"
            aria-label="Loading APX"
          >
            {/* Ember curtain: trails the ink one by a beat. */}
            <motion.div
              className="absolute inset-0"
              exit={{ y: "-100vh" }}
              transition={{ duration: 1, ease: ease.swift, delay: 0.16 }}
            >
              <svg
                className="absolute left-0 top-0 h-[132vh] w-full"
                viewBox="0 0 100 132"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  fill="var(--color-ember)"
                  initial={{ d: HANG }}
                  exit={{ d: FLAT }}
                  transition={{ duration: 1, ease: ease.swift, delay: 0.16 }}
                />
              </svg>
            </motion.div>

            {/* Ink curtain. */}
            <motion.div
              className="absolute inset-0"
              exit={{ y: "-100vh" }}
              transition={{ duration: 1, ease: ease.swift }}
            >
              <svg
                className="absolute left-0 top-0 h-[132vh] w-full"
                viewBox="0 0 100 132"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  fill="var(--color-ink)"
                  initial={{ d: HANG }}
                  exit={{ d: FLAT }}
                  transition={{ duration: 1, ease: ease.swift }}
                />
              </svg>

              <motion.div
                className="absolute inset-0"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {/* The four words */}
                <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                  <div className="relative h-[1.15em] w-full overflow-hidden text-center text-[clamp(2.75rem,9vw,7.5rem)] display">
                    <AnimatePresence initial={false}>
                      {step >= 0 && step < WORDS.length && (
                        <motion.span
                          key={WORDS[step]}
                          className="absolute inset-x-0 top-0 block leading-[1.15]"
                          initial={{ y: "105%" }}
                          animate={{ y: "0%" }}
                          exit={{ y: "-105%" }}
                          transition={{ duration: 0.42, ease: ease.expo }}
                        >
                          {WORDS[step]}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer row: caption, counter, progress hairline */}
                <div className="shell absolute inset-x-0 bottom-0 pb-7 md:pb-9">
                  <div className="flex items-end justify-between">
                    <p className="label text-mute">
                      APX <span className="mx-2 text-faint">/</span> Web studio
                    </p>
                    <motion.span className="font-mono text-[clamp(1.5rem,3.2vw,2.5rem)] font-medium leading-none tabular-nums tracking-tight text-bone">
                      {digits}
                    </motion.span>
                  </div>
                  <div className="mt-5 h-px w-full bg-white/10">
                    <motion.div className="h-px origin-left bg-ember" style={{ scaleX: bar }} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The wordmark sits above the curtains so it can fly to the header as they lift. */}
      {showLogo && (
        <div className="intro-root pointer-events-none fixed inset-0 z-[65] grid place-items-center">
          <motion.div layoutId="apx-logo" className="w-[clamp(11rem,28vw,23rem)] text-bone">
            <Logo draw className="block h-auto w-full" />
          </motion.div>
        </div>
      )}
    </>
  );
}
