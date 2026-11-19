"use client";

import { motion, type Transition } from "framer-motion";
import { useId } from "react";

/**
 * The APX wordmark.
 *
 * Each letter is a single stroked path clipped to a flat cap-height and baseline,
 * so the same geometry can be drawn on (the intro) or shown solid (everywhere else).
 * The A has no crossbar: it is the peak, and its tip carries the ember accent.
 */

const LETTERS = [
  // Λ
  "M2.15 64 L28 12.3 L53.85 64",
  // P
  "M73.5 64 V5.5 H92 A14 14 0 0 1 92 33.5 H73.5",
  // X (two strokes)
  "M121.9 -8 L178.1 64",
  "M178.1 -8 L121.9 64",
];

const STROKE = 11;

type LogoProps = {
  className?: string;
  /** Animate the strokes drawing on. */
  draw?: boolean;
  /** Seconds to wait before drawing starts. */
  delay?: number;
  /** With `draw`, hold the strokes back until this is true. Defaults to drawing straight away. */
  play?: boolean;
  title?: string;
};

export function Logo({ className, draw = false, delay = 0, play = true, title = "APX" }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  const boxId = `apx-box-${uid}`;
  const tipId = `apx-tip-${uid}`;

  const strokeTransition = (i: number): Transition => ({
    pathLength: { duration: 0.7, delay: delay + i * 0.11, ease: [0.65, 0, 0.35, 1] },
    opacity: { duration: 0.01, delay: delay + i * 0.11 },
  });

  return (
    <svg
      viewBox="0 0 179 56"
      className={className}
      data-draw={draw ? "" : undefined}
      role="img"
      aria-label={title}
      fill="none"
      overflow="hidden"
    >
      <defs>
        <clipPath id={boxId}>
          <rect x="0" y="0" width="179" height="56" />
        </clipPath>
        <clipPath id={tipId}>
          <rect x="0" y="0" width="60" height="15.5" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${boxId})`} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="miter">
        {LETTERS.map((d, i) =>
          draw ? (
            <motion.path
              key={d}
              d={d}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={play ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              transition={strokeTransition(i)}
            />
          ) : (
            <path key={d} d={d} />
          ),
        )}
      </g>

      {/* Ember tip of the peak */}
      <g clipPath={`url(#${tipId})`}>
        {draw ? (
          <motion.path
            d={LETTERS[0]}
            stroke="var(--color-ember)"
            strokeWidth={STROKE}
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: play ? 1 : 0 }}
            transition={{ duration: 0.5, delay: delay + 0.75, ease: "easeOut" }}
          />
        ) : (
          <path d={LETTERS[0]} stroke="var(--color-ember)" strokeWidth={STROKE} strokeLinejoin="miter" />
        )}
      </g>
    </svg>
  );
}

/** Just the peak, for small marks and the favicon. */
export function PeakMark({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 56 56" className={className} aria-hidden="true" fill="none" overflow="hidden">
      <defs>
        <clipPath id={`pk-${uid}`}>
          <rect x="0" y="0" width="56" height="15.5" />
        </clipPath>
      </defs>
      <path d={LETTERS[0]} stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="miter" />
      <path
        d={LETTERS[0]}
        stroke="var(--color-ember)"
        strokeWidth={STROKE}
        strokeLinejoin="miter"
        clipPath={`url(#pk-${uid})`}
      />
    </svg>
  );
}
