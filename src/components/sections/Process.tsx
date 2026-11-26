"use client";

import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef, useSyncExternalStore } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { processSteps } from "@/lib/site";

import { SectionHeading } from "../ui/SectionHeading";

const COUNT = processSteps.length;

const noop = () => () => {};
/** Whether the browser can tie an animation to the scroll position by itself (see .process-sheet). */
const scrollTimelines = () => typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");

/** A point on the line. It fills in as the line reaches it. */
function Marker({ at, progress }: { at: number; progress: MotionValue<number> }) {
  const reached = useTransform(progress, [at - 0.05, at + 0.01], [0, 1]);
  const scale = useTransform(reached, [0, 1], [0.4, 1]);
  return (
    <span className="relative grid h-5 w-5 place-items-center">
      <span className="absolute inset-0 rounded-full border border-ink/25 bg-paper" />
      <motion.span
        className="absolute inset-0 rounded-full bg-ember-deep/20"
        style={{ opacity: reached, scale: 1.9 }}
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
  // The copy is always fully legible. Reaching a step just settles it into place:
  // the line and its markers are what show progress.
  const y = useTransform(progress, [at - 0.07, at + 0.02], [14, 0]);
  return (
    <motion.div data-reveal="" style={{ y }}>
      <p className="label text-ember-ink">{step.index}</p>
      <h3 className="display mt-3 text-[clamp(1.75rem,2.6vw,2.6rem)] text-ink">{step.title}</h3>
      <p className="mt-3 max-w-[19rem] text-[1.0625rem] leading-relaxed text-ink/70">{step.body}</p>
    </motion.div>
  );
}

/** How a project runs: four steps along a line that inks itself in as you scroll. */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const wide = useRef<HTMLDivElement>(null);
  const narrow = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  // The line follows the scroll position directly, so nothing keeps animating once
  // the page has stopped moving.
  const { scrollYProgress: wideScroll } = useScroll({ target: wide, offset: ["start 0.8", "end 0.55"] });
  const { scrollYProgress: narrowScroll } = useScroll({ target: narrow, offset: ["start 0.75", "end 0.55"] });
  const full = useMotionValue(1);
  const wideProgress = reduced ? full : wideScroll;
  const narrowProgress = reduced ? full : narrowScroll;

  // The sheet of paper arrives a little small and grows to full width as it comes up. Where
  // the browser can do that itself, from the scroll position, the stylesheet does it (see
  // .process-sheet in globals.css) and the graphics card runs it. Elsewhere it is done here.
  const { scrollYProgress: arrival } = useScroll({ target: section, offset: ["start end", "start 0.25"] });
  const grow = useTransform(arrival, [0, 1], [0.9, 1]);
  const byBrowser = useSyncExternalStore(noop, scrollTimelines, () => false);

  return (
    <section ref={section} id="process" aria-labelledby="process-title" className="px-2 md:px-4">
      <motion.div
        // (Marked as a reveal so that, without scripts, it is simply shown at full size.)
        data-reveal=""
        className="process-sheet relative origin-top overflow-hidden rounded-[2rem] bg-paper text-ink md:rounded-[3rem]"
        // (Given a size either way: dropping the style would leave the server's starting size behind.)
        style={{ scale: reduced || byBrowser ? 1 : grow }}
      >
        <div className="shell relative py-24 md:py-36">
          <SectionHeading
            index="04"
            label="How it works"
            title={"From hello|to *live.*"}
            tone="light"
            id="process-title"
          >
            <p>Four steps from the first chat to launch day. No mystery and no jargon along the way.</p>
          </SectionHeading>

          {/* Wide screens: the line runs left to right, one column per step. */}
          <div ref={wide} className="mt-20 hidden lg:block">
            <div aria-hidden="true" className="relative h-5">
              <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink/15" />
              <motion.span
                className="absolute inset-x-0 top-1/2 h-[2px] origin-left -translate-y-1/2 bg-ember-deep"
                style={{ scaleX: wideProgress }}
              />
              {processSteps.map((step, i) => (
                <span key={step.index} className="absolute top-0" style={{ left: `${(i / COUNT) * 100}%` }}>
                  <Marker at={i / COUNT + 0.02} progress={wideProgress} />
                </span>
              ))}
            </div>
            <ol className="mt-9 grid grid-cols-4">
              {processSteps.map((step, i) => (
                <li key={step.index} className="pr-10">
                  <StepCopy index={i} progress={wideProgress} at={i / COUNT + 0.02} />
                </li>
              ))}
            </ol>
          </div>

          {/* Narrow screens: the line runs down the page instead. */}
          <ol ref={narrow} className="relative mt-14 grid gap-12 pl-10 lg:hidden">
            <span aria-hidden="true" className="absolute bottom-2 left-[9px] top-2 w-px bg-ink/15" />
            <motion.span
              aria-hidden="true"
              className="absolute bottom-2 left-[8.5px] top-2 w-[2px] origin-top bg-ember-deep"
              style={{ scaleY: narrowProgress }}
            />
            {processSteps.map((step, i) => (
              <li key={step.index} className="relative">
                <span aria-hidden="true" className="absolute -left-10 top-0.5">
                  <Marker at={(i + 0.5) / COUNT - 0.08} progress={narrowProgress} />
                </span>
                <StepCopy index={i} progress={narrowProgress} at={(i + 0.5) / COUNT - 0.08} />
              </li>
            ))}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}
