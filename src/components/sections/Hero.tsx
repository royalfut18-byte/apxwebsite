"use client";

import { motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ease } from "@/lib/cn";
import { site } from "@/lib/site";

import { Aurora } from "../Aurora";
import { useIntro } from "../providers/IntroProvider";
import { Showcase } from "../Showcase";
import { Button } from "../ui/Button";
import { LocalTime } from "../ui/LocalTime";
import { Magnetic } from "../ui/Magnetic";
import { Reveal } from "../ui/Reveal";
import { RevealText } from "../ui/RevealText";

const clamp = (v: number) => Math.min(1, Math.max(0, v));
/** Ease in and out. */
const smooth = (v: number) => v * v * (3 - 2 * v);

/** At centre stage the wall is at most this many times its resting size... */
const MAX_GROW = 1.45;
/** ...and at most this share of the screen's height. */
const STAGE_SHARE = 0.56;

/**
 * The hero has three ways of behaving (set in CSS, see .hero-track in globals.css):
 *
 *  - "showcase": it is pinned for two screens of scrolling. Over the first, the copy clears
 *    away and the wall of work rises to the middle of the screen and grows: the visitor
 *    scrolls through the work. Over the second, the page slides up over it.
 *  - "pinned": the same without the showcase, for visitors who ask for reduced motion.
 *  - "flow": very short screens (a phone on its side), where it is not pinned at all.
 */
type Mode = "showcase" | "pinned" | "flow";

export function Hero() {
  const { ready } = useIntro();
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const wall = useRef<HTMLDivElement>(null);

  const flowing = useMediaQuery("(max-height: 600px)");
  const reduced = useReducedMotion();
  const mode: Mode = flowing ? "flow" : reduced ? "pinned" : "showcase";
  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Both run 0..1 and come from one scroll range: the hero's track, top to bottom.
  // `show` is the showcase; `cover` is the page sliding over (or, unpinned, the hero leaving).
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end start"] });
  const show = useTransform(scrollYProgress, (v) => (modeRef.current === "showcase" ? clamp(v * 3) : 0));
  const cover = useTransform(scrollYProgress, (v) =>
    clamp(modeRef.current === "showcase" ? v * 3 - 1 : modeRef.current === "pinned" ? v * 2 : v),
  );

  // Where the wall has to travel to reach centre stage, and how much it can grow there.
  // Measured from the layout, so it is right on every screen. (`fitted` only exists to
  // make the values below recompute when the measurements change.)
  const fit = useRef({ rise: 0, grow: 1 });
  const fitted = useMotionValue(0);
  const wallScale = useTransform([show, cover, fitted], ([s, c]: number[]) =>
    modeRef.current === "showcase" ? (1 + (fit.current.grow - 1) * smooth(s)) * (1 - c * 0.06) : 1,
  );
  const wallY = useTransform([show, cover, fitted], ([s, c]: number[]) =>
    modeRef.current === "showcase" ? smooth(s) * fit.current.rise + c * 36 : 0,
  );
  useEffect(() => {
    const frame = stage.current;
    const box = wall.current;
    if (!frame || !box) return;
    const measure = () => {
      const ring = box.querySelector<HTMLElement>(".wall");
      if (!ring) return;
      // The box may be mid-transform, so distances inside it are divided by its current scale.
      const boxRect = box.getBoundingClientRect();
      const ringRect = ring.getBoundingClientRect();
      const offset =
        (ringRect.top + ringRect.height / 2 - (boxRect.top + boxRect.height / 2)) / wallScale.get();
      const height = frame.offsetHeight;
      const screen = ring.querySelector<HTMLElement>(".wall-screen")?.offsetWidth || ring.offsetWidth;
      // As large as the screen's height allows, without the front screen outgrowing its width.
      const grow = Math.max(
        1,
        Math.min(MAX_GROW, (height * STAGE_SHARE) / ring.offsetHeight, (frame.offsetWidth * 0.94) / screen),
      );
      // (A little below the middle of the screen, leaving room for the showcase's line above.)
      const rise = height * 0.53 - (box.offsetTop + box.offsetHeight / 2) - offset * grow;
      if (Math.abs(rise - fit.current.rise) < 0.5 && Math.abs(grow - fit.current.grow) < 0.002) return;
      fit.current = { rise, grow };
      fitted.set(fitted.get() + 1);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    observer.observe(box);
    measure();
    return () => observer.disconnect();
  }, [fitted, wallScale]);

  // The copy clears away early in the showcase (or, without one, as the page slides over).
  const copyOpacity = useTransform([show, cover], ([s, c]: number[]) =>
    modeRef.current === "showcase" ? 1 - clamp(s / 0.42) : 1 - clamp(c / 0.55),
  );
  const copyY = useTransform(
    [show, cover],
    ([s, c]: number[]) => `${-(modeRef.current === "showcase" ? clamp(s / 0.6) * 9 : c * 16)}%`,
  );
  // Once it is gone it must not sit invisibly in the way of the wall underneath it.
  const copyEvents = useTransform(copyOpacity, (o) => (o < 0.2 ? "none" : "auto"));
  const notesOpacity = useTransform(show, (s) => 1 - clamp(s / 0.25));
  // A line of its own for the showcase: in once the copy has gone, out as the page arrives.
  const billOpacity = useTransform(
    [show, cover],
    ([s, c]: number[]) => clamp((s - 0.5) / 0.3) * (1 - clamp(c / 0.35)),
  );
  const billY = useTransform(show, (s) => `${(1 - smooth(clamp((s - 0.45) / 0.4))) * 1.5}rem`);
  // The dark behind the words lifts with them, and the light spreads up behind the wall.
  const scrimOpacity = useTransform(show, (s) => 1 - 0.8 * smooth(clamp(s / 0.7)));
  const glowOpacity = useTransform(cover, [0, 0.9], [1, 0.3]);

  // The light leans a little toward the mouse.
  const pointer = useRef(0);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer.current = e.clientX / window.innerWidth - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  const shift = useCallback(
    (): [number, number] => [pointer.current * 0.1, -0.2 * smooth(show.get())],
    [show],
  );

  // Stop the moving parts once the page has completely covered the hero.
  const [covered, setCovered] = useState(false);
  useMotionValueEvent(cover, "change", (v) => setCovered(v > 0.995));

  return (
    <section ref={track} id="top" className="hero-track relative" aria-label="Introduction">
      <div className="hero-frame">
        <div ref={stage} className="hero-stage bg-ink">
          {/* Light behind the wall of work */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 will-change-[opacity]"
            style={{ opacity: glowOpacity }}
          >
            <motion.div
              data-reveal=""
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ duration: 2.4, ease: ease.quart, delay: 0.1 }}
            >
              <Aurora
                className="absolute inset-0"
                focus={[0.5, 0.7]}
                reach={[0.8, 0.5]}
                gain={0.95}
                shift={shift}
                active={ready && !covered}
              />
            </motion.div>
            <div className="grain absolute inset-0" />
            {/* Keeps the glow below the words, so they are always read against the dark. */}
            <motion.div
              className="hero-scrim absolute inset-0 will-change-[opacity]"
              style={{ opacity: scrimOpacity }}
            />
          </motion.div>

          {/* The copy lifts and fades as the showcase begins. It gets its own layer
              (will-change) so that is done by the graphics card, not by redrawing the text. */}
          <motion.div
            className="shell relative z-20 flex flex-col items-center pt-[6.25rem] text-center will-change-[transform,opacity] md:pt-[clamp(6rem,12svh,9rem)]"
            style={
              reduced
                ? { opacity: copyOpacity, pointerEvents: copyEvents }
                : { y: copyY, opacity: copyOpacity, pointerEvents: copyEvents }
            }
          >
            <Reveal wipe show={ready} delay={0.2} y={16} className="flex items-center gap-3">
              <span className="pulse-dot block h-2 w-2 rounded-full bg-ember" />
              <span className="label text-bone-dim">Web studio &middot; {site.location}</span>
            </Reveal>

            <RevealText
              as="h1"
              show={ready}
              delay={0.12}
              stagger={0.07}
              text={"We take local businesses\nto the *top.*"}
              // Sized by width, and on larger screens also by height, so it never crowds the wall.
              className="display mt-5 text-[clamp(2.5rem,12.2vw,4.25rem)] text-bone md:mt-[clamp(1rem,2.4svh,1.75rem)] md:text-[clamp(3.25rem,min(5.5vw,10.5svh),9rem)] md:[@media(max-aspect-ratio:1/1)]:text-[clamp(3.5rem,8.6vw,5.75rem)]"
            />

            <Reveal
              wipe
              show={ready}
              delay={0.7}
              // The first thing to go when the screen is short, so the wall keeps its room.
              className="mt-5 max-w-[37rem] md:mt-[clamp(1rem,2.6svh,1.75rem)] [@media(max-height:659px)]:hidden md:[@media(max-height:719px)]:hidden"
            >
              <p className="text-[1.0625rem] leading-relaxed text-bone-dim md:text-lg">
                APX builds websites that win work, gets them found on Google, runs the Instagram, and builds
                the tools that keep customers coming back.
              </p>
            </Reveal>

            <Reveal
              wipe
              show={ready}
              delay={0.85}
              className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 md:mt-[clamp(1.25rem,3.2svh,2.25rem)]"
            >
              <Magnetic strength={0.2}>
                <Button href="#contact" size="compact">
                  Start a project
                </Button>
              </Magnetic>
              <Magnetic strength={0.2}>
                <Button href="#work" variant="ghost" size="compact">
                  See the work
                </Button>
              </Magnetic>
            </Reveal>
          </motion.div>

          {/* The wall of work. In the showcase it rises to the middle of the screen and grows. */}
          <motion.div
            ref={wall}
            className="hero-wall z-10 pb-5 pt-9 will-change-transform md:pt-6"
            style={reduced ? undefined : { y: wallY, scale: wallScale }}
          >
            <Showcase show={ready} paused={covered} zoom={wallScale} />
          </motion.div>

          {/* The far ends of the wall, and of the glow, fall away into the dark. */}
          <div aria-hidden="true" className="hero-vignette" />

          {/* The showcase's own line, above the wall once it has taken centre stage.
              (Decorative: the portfolio further down says the same thing properly.) */}
          <motion.div
            aria-hidden="true"
            className="shell pointer-events-none absolute inset-x-0 top-[clamp(5.5rem,13svh,9rem)] z-20 text-center will-change-[transform,opacity]"
            style={{ opacity: billOpacity, y: billY }}
          >
            <p className="label text-bone-dim">Drag it, scroll it, click a screen</p>
            <p className="display mt-3 text-[clamp(1.6rem,7.4vw,2.25rem)] text-bone md:text-[clamp(1.75rem,min(3.4vw,6svh),3.5rem)]">
              Real businesses. <span className="accent">All live.</span>
            </p>
          </motion.div>

          {/* Corner notes, where there is room for them */}
          <motion.div
            className="shell pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden lg:block [@media(max-height:700px)]:hidden"
            style={{ opacity: notesOpacity }}
          >
            <Reveal wipe show={ready} delay={1.15} y={12} className="flex items-center justify-between">
              <a
                href="#services"
                className="label group pointer-events-auto flex items-center gap-3 text-mute transition-colors hover:text-bone"
              >
                <span className="relative block h-7 w-px overflow-hidden bg-white/15">
                  <span className="scroll-hint absolute inset-x-0 top-0 block h-3 bg-ember" />
                </span>
                Scroll
              </a>
              <p className="label text-mute">
                Local time <LocalTime className="text-bone-dim" />
              </p>
            </Reveal>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
