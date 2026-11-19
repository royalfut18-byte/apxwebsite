"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ease } from "@/lib/cn";
import { site, SUMMIT_METRES } from "@/lib/site";

import { useIntro } from "../providers/IntroProvider";
import { Terrain } from "../Terrain";
import { Button } from "../ui/Button";
import { LocalTime } from "../ui/LocalTime";
import { Magnetic } from "../ui/Magnetic";
import { Reveal } from "../ui/Reveal";
import { RevealText } from "../ui/RevealText";

const DISCIPLINES = ["Websites", "SEO", "Instagram", "Custom tools"];

export function Hero() {
  const { ready } = useIntro();
  const track = useRef<HTMLElement>(null);

  // The hero is pinned for one screen of scrolling while the page slides over it (see
  // .hero-track in globals.css). On very short viewports it is not pinned at all.
  //
  // Either way `journey` runs 0..1 over the hero's time on screen. It is derived from one
  // fixed scroll range: in the pinned layout the track is two screens tall, so the hero
  // is fully covered at the halfway point; unpinned, it is covered when it has scrolled away.
  const unpinned = useMediaQuery("(max-height: 600px)");
  const pinnedRef = useRef(true);
  useEffect(() => {
    pinnedRef.current = !unpinned;
  }, [unpinned]);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end start"] });
  const journey = useTransform(scrollYProgress, (v) =>
    Math.min(1, Math.max(0, v * (pinnedRef.current ? 2 : 1))),
  );

  const contentY = useTransform(journey, [0, 1], ["0%", "-22%"]);
  const contentOpacity = useTransform(journey, [0, 0.5], [1, 0]);
  const frameScale = useTransform(journey, [0, 1], [1, 0.93]);
  const frameRadius = useTransform(journey, [0, 0.25], [0, 32]);
  const glowOpacity = useTransform(journey, [0, 0.9], [1, 0.25]);

  // The mountain fades up once the curtain lifts, then dims as the camera climbs away.
  const dawn = useMotionValue(0);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  useEffect(() => {
    if (!ready) return;
    const controls = animate(
      dawn,
      1,
      reduced ? { duration: 0 } : { duration: 2.4, ease: ease.quart, delay: 0.15 },
    );
    return () => controls.stop();
  }, [ready, reduced, dawn]);
  const intensity = useTransform([dawn, journey], ([d, p]: number[]) => d * (1 - p * 0.72));

  // Where the summit is on screen, reported by the 3D scene every frame.
  const summitX = useMotionValue(-999);
  const summitY = useMotionValue(-999);
  const summit = useMemo(() => ({ x: summitX, y: summitY }), [summitX, summitY]);
  const calloutOpacity = useTransform(journey, [0, 0.22], [1, 0]);

  // Stop drawing once the page has completely covered the hero.
  const [covered, setCovered] = useState(false);
  useMotionValueEvent(journey, "change", (v) => setCovered(v > 0.995));

  return (
    <section ref={track} id="top" className="hero-track relative" aria-label="Introduction">
      <div className="hero-frame">
        <motion.div
          className="relative h-full w-full overflow-hidden bg-ink"
          style={reduced || unpinned ? undefined : { scale: frameScale, borderRadius: frameRadius }}
        >
          {/* First light behind the summit */}
          <motion.div aria-hidden="true" className="absolute inset-0" style={{ opacity: glowOpacity }}>
            <motion.div
              data-reveal=""
              className="absolute inset-0 bg-[radial-gradient(58%_52%_at_50%_34%,rgba(255,91,46,0.34)_0%,rgba(255,91,46,0.11)_38%,rgba(255,91,46,0)_72%)] md:bg-[radial-gradient(44%_58%_at_75%_36%,rgba(255,91,46,0.36)_0%,rgba(255,91,46,0.12)_38%,rgba(255,91,46,0)_72%)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: ready ? 1 : 0 }}
              transition={{ duration: 2.6, ease: ease.quart, delay: 0.2 }}
            />
          </motion.div>

          <Terrain
            view="peak"
            progress={journey}
            intensity={intensity}
            active={ready && !covered}
            summit={summit}
            className="absolute inset-0 h-full w-full"
          />

          {/* A surveyor's note pinned to the tip of the mountain */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 hidden md:block"
            style={{ x: summitX, y: summitY, opacity: calloutOpacity }}
          >
            <svg
              viewBox="0 0 92 40"
              className="absolute -top-[46px] left-[5px] h-10 w-[92px] overflow-visible"
              fill="none"
            >
              <motion.path
                d="M0 40 L30 6 H92"
                stroke="rgba(241,238,231,0.55)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: ready ? 1 : 0 }}
                transition={{ duration: 0.9, ease: ease.quart, delay: ready ? 2.3 : 0 }}
              />
            </svg>
            {/* The label writes itself in from the left once the leader line has landed. */}
            <motion.p
              className="label absolute -top-[3.75rem] left-[39px] whitespace-nowrap text-bone-dim"
              initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
              animate={{ clipPath: ready ? "inset(0% 0% 0% 0%)" : "inset(0% 100% 0% 0%)" }}
              transition={{ duration: 0.8, ease: ease.expo, delay: ready ? 2.9 : 0 }}
            >
              Summit <span className="ml-2 text-ember">{SUMMIT_METRES.toLocaleString("en-AU")} m</span>
            </motion.p>
          </motion.div>

          {/* Scrims: keep the header and the copy readable over the lines */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-ink)_4%,rgba(7,7,8,0.9)_34%,rgba(7,7,8,0.58)_52%,rgba(7,7,8,0)_74%)] md:bg-[linear-gradient(72deg,var(--color-ink)_6%,rgba(7,7,8,0.78)_30%,rgba(7,7,8,0)_58%)]"
          />

          <motion.div
            className="shell relative z-10 flex h-full flex-col justify-end pb-5 pt-24 md:pb-7"
            style={reduced ? { opacity: contentOpacity } : { y: contentY, opacity: contentOpacity }}
          >
            <Reveal wipe show={ready} delay={0.2} y={16} className="mb-5 flex items-center gap-3 md:mb-7">
              <span className="pulse-dot block h-2 w-2 rounded-full bg-ember" />
              <span className="label text-bone-dim">Web studio &middot; {site.location}</span>
            </Reveal>

            <RevealText
              as="h1"
              show={ready}
              delay={0.12}
              stagger={0.07}
              text={"We take local\nbusinesses\nto the *top.*"}
              // Sized by width, and on larger screens also by height, so three lines always fit.
              className="display text-[clamp(2.5rem,12.6vw,4.5rem)] text-bone md:text-[clamp(4.5rem,min(9.6vw,15.5svh),12.5rem)]"
            />

            <div className="mt-7 flex flex-col gap-7 md:mt-10 lg:flex-row lg:items-end lg:justify-between">
              <Reveal wipe show={ready} delay={0.75} className="max-w-[31rem]">
                <p className="text-[1.0625rem] leading-relaxed text-bone-dim md:text-lg">
                  APX builds websites that win work, gets them found on Google, runs the Instagram, and builds
                  the tools that keep customers coming back.
                </p>
              </Reveal>

              <Reveal wipe show={ready} delay={0.9} className="flex shrink-0 flex-wrap items-center gap-3">
                <Magnetic strength={0.2}>
                  <Button href="#contact">Start a project</Button>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <Button href="#work" variant="ghost">
                    See the work
                  </Button>
                </Magnetic>
              </Reveal>
            </div>

            <Reveal
              wipe
              show={ready}
              delay={1.15}
              y={12}
              // The first thing to go when the screen is short.
              className="mt-8 flex items-center justify-between gap-6 border-t border-white/10 pt-4 md:mt-12 md:pt-5 [@media(max-height:700px)]:hidden"
            >
              <a
                href="#services"
                className="label group flex items-center gap-3 text-mute transition-colors hover:text-bone"
              >
                <span className="relative block h-7 w-px overflow-hidden bg-white/15">
                  <motion.span
                    className="absolute inset-x-0 top-0 block h-3 bg-ember"
                    animate={{ y: ["-100%", "260%"] }}
                    transition={{ duration: 1.9, ease: ease.inOut, repeat: Infinity, repeatDelay: 0.35 }}
                  />
                </span>
                Scroll
              </a>

              <ul className="label hidden items-center gap-5 text-mute lg:flex">
                {DISCIPLINES.map((d, i) => (
                  <li key={d} className="flex items-center gap-5">
                    {i > 0 && <span className="text-faint">/</span>}
                    {d}
                  </li>
                ))}
              </ul>

              <p className="label text-mute">
                <span className="hidden sm:inline">Local time </span>
                <LocalTime className="text-bone-dim" />
              </p>
            </Reveal>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
