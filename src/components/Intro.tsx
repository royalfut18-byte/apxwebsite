"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

import { cn, ease } from "@/lib/cn";

import { Logo, Mark } from "./Logo";
import { useIntro } from "./providers/IntroProvider";

/**
 * The opening sequence.
 *
 * Four words (what APX does) roll past in 3D, like the faces of a drum, while a counter
 * climbs, the wordmark draws itself, then two curtains lift: ink first, with a band of colour behind it. The
 * wordmark does not fade out. It flies up into the header and becomes the
 * logo (it shares a `layoutId` with the one in <Nav />).
 *
 * Four things keep it dependable, slow phones and old laptops included:
 *
 *  - The curtain is part of the page's HTML, so it is there from the first paint, and
 *    CSS alone keeps it alive (see "Intro" in globals.css) until the scripts arrive.
 *  - Everything that moves is a transform or an opacity, which Framer Motion hands to
 *    the browser's compositor. It keeps running even when the page itself is busy.
 *  - The steps are chained: each one waits for the previous one to have been on screen,
 *    so a slow start can delay the sequence but can never skip part of it.
 *  - Each step also waits for a frame to be drawn, which only happens while the tab is
 *    being looked at. A page opened in a background tab holds its intro until then.
 *
 * Visitors who ask for reduced motion get the same sequence with nothing travelling:
 * the words cross-fade, the wordmark simply appears, and the curtain fades away.
 */

const WORDS = ["Websites", "SEO", "Instagram", "Tools"];
const WORD_MS = 370;
const LOGO_MS = 1000;
const HOLD_MS = 240;
const FONT_WAIT_MS = 500;
const LIFT_S = 1;

// The curtains.
const REST = "translateY(0%)";

// The words are faces of a drum that turns away from the visitor: each one rolls up from
// underneath, faces them, and rolls on over the top. `DEPTH` is how far a face sits from
// the drum's axis. Written as one transform so the browser's compositor can run it.
const DEPTH = "0.6em";
const face = (deg: number) =>
  `perspective(900px) translateZ(-${DEPTH}) rotateX(${deg}deg) translateZ(${DEPTH})`;
const FACE = { below: face(-90), front: face(0), above: face(90) };

/** One of the two curtains. Its lower edge hangs in a curve that flattens as it lifts. */
function Sheet({
  className,
  delay,
  lift,
  children,
}: {
  className: string;
  delay: number;
  /** False for reduced motion, where the curtain fades instead of moving. */
  lift: boolean;
  children?: React.ReactNode;
}) {
  const transition = { duration: LIFT_S, ease: ease.swift, delay };
  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      initial={{ transform: REST }}
      exit={lift ? { transform: "translateY(-100%)" } : undefined}
      transition={transition}
    >
      {children}
      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-full block h-[16vh] w-full origin-top bg-inherit [border-radius:0_0_50%_50%/0_0_100%_100%]"
        initial={{ transform: "scaleY(1)" }}
        exit={lift ? { transform: "scaleY(0)" } : undefined}
        transition={transition}
      />
    </motion.div>
  );
}

export function Intro() {
  const { phase, skipped, reduced, setPhase } = useIntro();
  // -1 before the scripts take over, then one step per word, then the wordmark.
  const [step, setStep] = useState(-1);
  const count = useMotionValue(0);
  const digits = useTransform(count, (v) => String(Math.round(v)).padStart(3, "0"));
  const bar = useTransform(count, (v) => `scaleX(${v / 100})`);

  useEffect(() => {
    if (phase !== "intro") return;

    // From here the scripts are in charge: this switches off the CSS-only safety net.
    document.documentElement.classList.add("intro-live");

    let cancelled = false;
    let counter: ReturnType<typeof animate> | undefined;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((done) => timers.push(window.setTimeout(done, ms)));
    const frame = () => new Promise<void>((done) => requestAnimationFrame(() => done()));

    (async () => {
      // Give the display face a moment to arrive, then begin on a painted frame so a busy
      // start-up cannot swallow the first word.
      await Promise.race([document.fonts?.ready ?? Promise.resolve(), wait(FONT_WAIT_MS)]);
      await frame();
      await frame();
      if (cancelled) return;

      const total = WORDS.length * WORD_MS + LOGO_MS + HOLD_MS;
      counter = animate(count, 100, { duration: total / 1000, ease: ease.inOut });

      for (let i = 0; i < WORDS.length; i++) {
        setStep(i);
        await wait(WORD_MS);
        await frame();
        if (cancelled) return;
      }

      setStep(WORDS.length);
      await wait(LOGO_MS + HOLD_MS);
      await frame();
      if (cancelled) return;
      setPhase("reveal");
    })();

    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      counter?.stop();
    };
    // Runs once: the sequence is fixed from the moment the page loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const word = step >= 0 && step < WORDS.length ? WORDS[step] : null;
  const showLogo = phase === "intro" && step >= WORDS.length;

  // No intro at all on this page load (a deep link, or a page other than home).
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
            exit={reduced ? { opacity: 0 } : undefined}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* A curtain of colour trails the ink one by a beat: the same light as the hero. */}
            <Sheet
              className="bg-[linear-gradient(to_right,var(--color-violet),var(--color-rose)_45%,var(--color-ember))]"
              delay={0.15}
              lift={!reduced}
            />

            <Sheet className="bg-ink" delay={0} lift={!reduced}>
              {/* Everything on the curtain leaves with it. Nothing here fades: text that is
                  never caught half-transparent is text that always passes a contrast check. */}
              <div className="absolute inset-0">
                {/* Shown by CSS only if the scripts are slow to arrive (see globals.css). */}
                <div className="intro-mark absolute inset-0 grid place-items-center" aria-hidden="true">
                  <Mark className="h-11 w-11 text-bone" />
                </div>

                {/* The four words */}
                <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                  <div className="display relative h-[1.15em] w-full text-center text-[clamp(2.75rem,9vw,7.5rem)]">
                    <AnimatePresence initial={false} mode={reduced ? "wait" : "sync"}>
                      {word && (
                        <motion.span
                          key={word}
                          className="intro-word absolute inset-x-0 top-0 block leading-[1.15] [backface-visibility:hidden]"
                          initial={reduced ? { opacity: 0 } : { transform: FACE.below }}
                          animate={reduced ? { opacity: 1 } : { transform: FACE.front }}
                          exit={
                            reduced
                              ? { opacity: 0, transition: { duration: 0.12 } }
                              : { transform: FACE.above }
                          }
                          transition={
                            reduced ? { duration: 0.2, ease: "easeOut" } : { duration: 0.5, ease: ease.expo }
                          }
                        >
                          {word}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer row: caption, counter, progress hairline */}
                <div className="shell absolute inset-x-0 bottom-0 pb-7 md:pb-9">
                  <div className="flex items-end justify-between">
                    <p className="label flex items-center gap-2.5 text-mute">
                      <span className="pulse-dot block h-1.5 w-1.5 rounded-full bg-ember" />
                      APX <span className="text-faint">/</span> Web studio
                    </p>
                    <motion.span className="font-mono text-[clamp(1.5rem,3.2vw,2.5rem)] font-medium leading-none tabular-nums tracking-tight text-bone">
                      {digits}
                    </motion.span>
                  </div>
                  <div className="relative mt-5 h-px w-full bg-white/10">
                    {/* Creeps along under CSS alone, so the screen is never still. */}
                    <div className="intro-creep absolute inset-0 origin-left bg-white/25" />
                    <motion.div
                      className="absolute inset-0 origin-left bg-ember"
                      style={{ transform: bar }}
                    />
                  </div>
                </div>
              </div>
            </Sheet>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The wordmark sits above the curtains so it can fly to the header as they lift. */}
      {showLogo && (
        <div className="intro-root pointer-events-none fixed inset-0 z-[65] grid place-items-center">
          <motion.div layoutId="apx-logo" className="w-[clamp(11rem,28vw,23rem)] text-bone">
            <Logo draw={!reduced} className="block h-auto w-full" />
          </motion.div>
        </div>
      )}
    </>
  );
}
