"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";

import { ease } from "@/lib/cn";
import { SUMMIT_METRES } from "@/lib/site";

import { useIntro } from "./providers/IntroProvider";

const TICKS = Array.from({ length: 21 }, (_, i) => i);

/**
 * Scroll progress, told as a climb. The marker starts at the foot of the rail and
 * rises as you move down the page, reading out the altitude on the way to
 * 2,228 m, the top of mainland Australia.
 *
 * Lives in the page gutter on wide screens only, and is purely decorative.
 */
export function AltitudeHud() {
  const { ready } = useIntro();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 32, restDelta: 0.0004 });
  const clamped = useTransform(progress, (v) => Math.min(1, Math.max(0, v)));
  const top = useTransform(clamped, (v) => `${(1 - v) * 100}%`);
  const metres = useTransform(clamped, (v) => `${Math.round(v * SUMMIT_METRES).toLocaleString("en-AU")} m`);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed right-[18px] top-1/2 z-40 hidden -translate-y-1/2 mix-blend-difference xl:block"
      // Slides in from beyond the right edge (no fade, so its type is never half-transparent).
      initial={{ x: 90 }}
      animate={{ x: ready ? 0 : 90 }}
      transition={{ duration: 1, ease: ease.expo, delay: ready ? 1.4 : 0 }}
    >
      {/* Summit */}
      <svg
        viewBox="0 0 56 56"
        className="mb-2.5 ml-auto h-2.5 w-2.5 translate-x-[4px] text-white"
        fill="none"
      >
        <path d="M2.15 64 L28 12.3 L53.85 64" stroke="currentColor" strokeWidth="11" strokeLinejoin="miter" />
      </svg>

      <div className="relative ml-auto h-48 w-2.5">
        {/* Rail and tick marks */}
        <div className="absolute right-0 top-0 h-full w-px bg-white/25" />
        {TICKS.map((i) => (
          <span
            key={i}
            className="absolute right-0 h-px bg-white/40"
            style={{ top: `${(i / (TICKS.length - 1)) * 100}%`, width: i % 5 === 0 ? 9 : 4 }}
          />
        ))}
        {/* Distance climbed */}
        <motion.div
          className="absolute bottom-0 right-0 h-full w-px origin-bottom bg-white"
          style={{ scaleY: clamped }}
        />
        {/* Marker and readout */}
        <motion.div className="absolute right-0" style={{ top }}>
          <span className="absolute -right-[3px] -top-[3.5px] block h-[7px] w-[7px] rounded-full bg-white" />
          <motion.span className="label absolute right-[17px] top-0 block origin-center -translate-y-1/2 whitespace-nowrap tabular-nums text-white [writing-mode:vertical-rl] [transform:translateY(-50%)_rotate(180deg)]">
            {metres}
          </motion.span>
        </motion.div>
      </div>

      {/* Base */}
      <span className="ml-auto mt-2.5 block h-px w-2.5 bg-white/60" />
    </motion.div>
  );
}
