"use client";

import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
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

export function Hero() {
  const { ready } = useIntro();
  const track = useRef<HTMLElement>(null);

  // On larger screens the hero is pinned for one screen of scrolling while the page slides
  // over it (see .hero-track in globals.css). On phones and very short screens it flows.
  //
  // Either way `journey` runs 0..1 over the hero's time on screen. It is derived from one
  // fixed scroll range: in the pinned layout the track is two screens tall, so the hero
  // is fully covered at the halfway point; unpinned, it is covered when it has scrolled away.
  const unpinned = useMediaQuery("(max-width: 767px), (max-height: 600px)");
  const pinnedRef = useRef(true);
  useEffect(() => {
    pinnedRef.current = !unpinned;
  }, [unpinned]);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end start"] });
  const journey = useTransform(scrollYProgress, (v) =>
    Math.min(1, Math.max(0, v * (pinnedRef.current ? 2 : 1))),
  );
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  // As the page slides over: the copy lifts and fades, the wall sinks back, the glow dims.
  const copyY = useTransform(journey, [0, 1], ["0%", "-16%"]);
  const copyOpacity = useTransform(journey, [0, 0.55], [1, 0]);
  const wallY = useTransform(journey, [0, 1], ["0%", "10%"]);
  const wallScale = useTransform(journey, [0, 1], [1, 0.9]);
  const glowOpacity = useTransform(journey, [0, 0.9], [1, 0.3]);

  // Stop the moving parts once the page has completely covered the hero.
  const [covered, setCovered] = useState(false);
  useMotionValueEvent(journey, "change", (v) => setCovered(v > 0.995));

  return (
    <section ref={track} id="top" className="hero-track relative" aria-label="Introduction">
      <div className="hero-frame">
        <div className="hero-stage bg-ink">
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
                active={ready && !covered}
              />
            </motion.div>
            <div className="grain absolute inset-0" />
            {/* Keeps the glow below the words, so they are always read against the dark. */}
            <div className="hero-scrim absolute inset-0" />
          </motion.div>

          {/* The copy drifts up and fades as the page slides over. It gets its own layer
              (will-change) so that is done by the graphics card, not by redrawing the text. */}
          <motion.div
            className="shell relative z-20 flex flex-col items-center pt-[6.25rem] text-center will-change-[transform,opacity] md:pt-[clamp(6rem,12svh,9rem)]"
            style={reduced ? { opacity: copyOpacity } : { y: copyY, opacity: copyOpacity }}
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

          {/* The wall of work. It sinks back a little as the page slides over. */}
          <motion.div
            className="hero-wall z-10 pb-5 pt-9 will-change-transform md:pt-6"
            style={reduced ? undefined : { y: wallY, scale: wallScale }}
          >
            <Showcase show={ready} paused={covered} />
          </motion.div>

          {/* The far ends of the wall, and of the glow, fall away into the dark. */}
          <div aria-hidden="true" className="hero-vignette" />

          {/* Corner notes, where there is room for them */}
          <Reveal
            wipe
            show={ready}
            delay={1.15}
            y={12}
            className="shell pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden items-center justify-between lg:flex [@media(max-height:700px)]:hidden"
          >
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
        </div>
      </div>
    </section>
  );
}
