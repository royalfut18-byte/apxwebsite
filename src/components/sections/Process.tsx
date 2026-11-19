"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { processSteps } from "@/lib/site";

import { SectionHeading } from "../ui/SectionHeading";

// The route is drawn in a 1200 x 360 box. One camp per step, each higher than the last.
const BOX = { w: 1200, h: 360 };
const CAMPS = [
  { x: 48, y: 300 },
  { x: 348, y: 222 },
  { x: 648, y: 142 },
  { x: 948, y: 62 },
];
const ROUTE =
  "M 0 314 C 16 310, 30 306, 48 300 S 270 244, 348 222 S 574 164, 648 142 S 874 84, 948 62 S 1130 22, 1200 6";
// Roughly where along the route each camp sits, as a fraction of its length.
const CAMP_AT = [0.04, 0.29, 0.545, 0.795];

function Camp({
  index,
  progress,
  vertical,
}: {
  index: number;
  progress: MotionValue<number>;
  vertical?: boolean;
}) {
  const at = vertical ? (index + 0.5) / processSteps.length - 0.08 : CAMP_AT[index];
  const reached = useTransform(progress, [at - 0.05, at + 0.01], [0, 1]);
  const scale = useTransform(reached, [0, 1], [0.4, 1]);
  const ring = useTransform(reached, [0, 1], [0, 1]);
  return (
    <span className="relative grid h-5 w-5 place-items-center">
      <span className="absolute inset-0 rounded-full border border-ink/25 bg-paper" />
      <motion.span
        className="absolute inset-0 rounded-full bg-ember-deep/20"
        style={{ opacity: ring, scale: 1.9 }}
      />
      <motion.span
        className="relative block h-2.5 w-2.5 rounded-full bg-ember-deep"
        style={{ scale, opacity: reached }}
      />
    </span>
  );
}

function StepCopy({ index, progress, at }: { index: number; progress: MotionValue<number>; at: number }) {
  const step = processSteps[index];
  // The copy is always fully legible. Reaching a camp just settles it into place:
  // the route line and the camp marker are what show progress.
  const y = useTransform(progress, [at - 0.07, at + 0.02], [14, 0]);
  return (
    <motion.div data-reveal="" style={{ y }}>
      <p className="label text-ember-ink">{step.index}</p>
      <h3 className="display mt-3 text-[clamp(1.75rem,2.6vw,2.6rem)] text-ink">{step.title}</h3>
      <p className="mt-3 max-w-[18rem] text-[1.0625rem] leading-relaxed text-ink/70">{step.body}</p>
    </motion.div>
  );
}

/** How a project runs, drawn as a route up the mountain that inks itself in as you scroll. */
export function Process() {
  const wide = useRef<HTMLDivElement>(null);
  const narrow = useRef<HTMLOListElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { scrollYProgress: wideRaw } = useScroll({ target: wide, offset: ["start 0.85", "end 0.6"] });
  const { scrollYProgress: narrowRaw } = useScroll({ target: narrow, offset: ["start 0.75", "end 0.55"] });
  const wideSpring = useSpring(wideRaw, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const narrowSpring = useSpring(narrowRaw, { stiffness: 90, damping: 24, restDelta: 0.001 });
  const full = useMotionValue(1);
  const wideProgress = reduced ? full : wideSpring;
  const narrowProgress = reduced ? full : narrowSpring;

  return (
    <section id="process" aria-labelledby="process-title" className="px-2 md:px-4">
      <div className="relative overflow-hidden rounded-[2rem] bg-paper text-ink md:rounded-[3rem]">
        {/* Faint contour rings in the corner, echoing the mountain */}
        <svg
          aria-hidden="true"
          viewBox="0 0 600 600"
          className="pointer-events-none absolute -right-40 -top-48 h-[42rem] w-[42rem] text-ink/[0.07]"
          fill="none"
        >
          {[40, 80, 122, 166, 212, 260, 300].map((r, i) => (
            <path
              key={r}
              d={`M ${300 - r} 300 C ${300 - r} ${300 - r * 0.62}, ${300 - r * 0.5} ${300 - r * 1.04}, ${300 + r * 0.06} ${300 - r * 0.98} S ${300 + r * 1.06} ${300 - r * 0.42}, ${300 + r} ${300 + r * 0.1} S ${300 + r * 0.44} ${300 + r * 1.02}, ${300 - r * 0.1} ${300 + r * 0.96} S ${300 - r} ${300 + r * 0.5}, ${300 - r} 300 Z`}
              stroke="currentColor"
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          ))}
        </svg>

        <div className="shell relative py-24 md:py-36">
          <SectionHeading
            index="04"
            label="How it works"
            title={"The route *up.*"}
            tone="light"
            id="process-title"
          >
            <p>Four stages, start to summit. No mystery and no jargon along the way.</p>
          </SectionHeading>

          {/* Wide screens: the route climbs left to right. */}
          <div ref={wide} className="relative mt-20 hidden lg:block">
            <div className="relative" style={{ height: BOX.h }}>
              <svg
                viewBox={`0 0 ${BOX.w} ${BOX.h}`}
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d={ROUTE}
                  stroke="rgba(7,7,8,0.16)"
                  strokeWidth="1.5"
                  strokeDasharray="2 7"
                  vectorEffect="non-scaling-stroke"
                />
                <motion.path
                  d={ROUTE}
                  stroke="var(--color-ember-deep)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  style={{ pathLength: wideProgress }}
                />
              </svg>

              {CAMPS.map((camp, i) => (
                <div
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${(camp.x / BOX.w) * 100}%`, top: camp.y }}
                >
                  <Camp index={i} progress={wideProgress} />
                </div>
              ))}

              {/* The summit flag */}
              <div className="absolute right-0 top-0 -translate-y-full pb-1">
                <p className="label flex items-center gap-2 text-ink/65">
                  <svg viewBox="0 0 56 56" className="h-3 w-3 text-ember-deep" fill="none" aria-hidden="true">
                    <path
                      d="M2.15 64 L28 12.3 L53.85 64"
                      stroke="currentColor"
                      strokeWidth="11"
                      strokeLinejoin="miter"
                    />
                  </svg>
                  Summit
                </p>
              </div>

              {/* Copy hangs beneath each camp */}
              <ol className="absolute inset-0">
                {processSteps.map((_, i) => (
                  <li
                    key={i}
                    className="absolute w-[22%]"
                    style={{ left: `${(CAMPS[i].x / BOX.w) * 100 - 0.8}%`, top: CAMPS[i].y + 34 }}
                  >
                    <StepCopy index={i} progress={wideProgress} at={CAMP_AT[i]} />
                  </li>
                ))}
              </ol>
            </div>
            {/* Room for the lowest step's copy, which hangs below the drawing. */}
            <div className="h-36" />
          </div>

          {/* Narrow screens: the route runs down the page instead. */}
          <ol ref={narrow} className="relative mt-14 grid gap-12 pl-10 lg:hidden">
            <span aria-hidden="true" className="absolute bottom-2 left-[9px] top-2 w-px bg-ink/15" />
            <motion.span
              aria-hidden="true"
              className="absolute bottom-2 left-[8.5px] top-2 w-[2px] origin-top bg-ember-deep"
              style={{ scaleY: narrowProgress }}
            />
            {processSteps.map((_, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-10 top-0.5">
                  <Camp index={i} progress={narrowProgress} vertical />
                </span>
                <StepCopy index={i} progress={narrowProgress} at={(i + 0.5) / processSteps.length - 0.08} />
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
