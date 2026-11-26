"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

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

/**
 * The opening screen: the headline over the wall of work and its glow. It is one screen
 * tall and scrolls away with the page like any other section.
 *
 * Nothing here is driven by the scroll. The wall and the glow each pause themselves when
 * they are off screen (see Showcase.tsx and Aurora.tsx).
 */
export function Hero() {
  const { ready, primed } = useIntro();

  // The light leans a little toward the mouse.
  const pointer = useRef(0);
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer.current = e.clientX / window.innerWidth - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  const shift = useCallback((): [number, number] => [pointer.current * 0.1, 0], []);

  return (
    <section id="top" className="hero-track relative" aria-label="Introduction">
      <div className="hero-frame">
        <div className="hero-stage bg-ink">
          {/* Light behind the wall of work */}
          <div aria-hidden="true" className="absolute inset-0">
            <motion.div
              data-reveal=""
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: primed ? 1 : 0 }}
              transition={{ duration: 2.4, ease: ease.quart, delay: 0.1 }}
            >
              {/* Drawn once behind the curtain (so it is ready), and set moving as it lifts. */}
              <Aurora
                className="absolute inset-0"
                focus={[0.5, 0.7]}
                reach={[0.8, 0.5]}
                gain={0.95}
                shift={shift}
                warm={primed}
                active={ready}
              />
            </motion.div>
            <div className="grain absolute inset-0" />
            {/* Keeps the glow below the words, so they are always read against the dark. */}
            <div className="hero-scrim absolute inset-0" />
          </div>

          <div className="shell relative z-20 flex flex-col items-center pt-[6.25rem] text-center md:pt-[clamp(6rem,12svh,9rem)]">
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
                APXS builds websites that win work, gets them found on Google, runs the Instagram, and builds
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
          </div>

          {/* The wall of work */}
          <div className="hero-wall z-10 pb-5 pt-9 md:pt-6">
            <Showcase show={ready} primed={primed} />
          </div>

          {/* The far ends of the wall, and of the glow, fall away into the dark. */}
          <div aria-hidden="true" className="hero-vignette" />

          {/* Corner notes, where there is room for them */}
          <div className="shell pointer-events-none absolute inset-x-0 bottom-6 z-20 hidden lg:block [@media(max-height:700px)]:hidden">
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
          </div>
        </div>
      </div>
    </section>
  );
}
