"use client";

import { useEffect, useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

type VelocityMarqueeProps = {
  children: React.ReactNode;
  /** Seconds for one full pass at rest. */
  seconds?: number;
  /** Travel left to right instead of right to left. */
  reverse?: boolean;
  className?: string;
};

const COPIES = 4;
/** One copy, as a share of the whole track. Looping over exactly this much is seamless. */
const STEP = 100 / COPIES;
/** How many passes the loop is wound forward before it starts (see `wind` below). */
const HEADROOM = 2000;

/**
 * An endless ticker, travelling at one steady speed whatever the page is doing.
 *
 * The movement is a single looping animation that the browser runs on its compositor,
 * so it costs nothing per frame. It pauses
 * whenever it is off screen, and stands still for visitors with animations turned down.
 */
export function VelocityMarquee({
  children,
  seconds = 26,
  reverse = false,
  className,
}: VelocityMarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const host = root.current;
    const el = track.current;
    if (!host || !el || reduced || typeof el.animate !== "function") return;

    // The loop runs over the middle of the track, so there is always a copy to either
    // side of the screen, whichever way it travels.
    const duration = seconds * 1000;
    const [from, to] = reverse ? [-2 * STEP, -STEP] : [-STEP, -2 * STEP];
    const animation = el.animate(
      [{ transform: `translateX(${from}%)` }, { transform: `translateX(${to}%)` }],
      { duration, iterations: Infinity, easing: "linear" },
    );
    // An animation that is run backwards into its own beginning ends there, and the row
    // would stop dead. So it begins a long way in: there are hours of room behind it.
    const wind = () => {
      animation.currentTime = duration * HEADROOM;
    };
    wind();
    animation.pause();

    let visible = false;
    animation.onfinish = () => {
      wind();
      if (visible) animation.play();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) animation.play();
      else animation.pause();
    });
    io.observe(host);

    return () => {
      io.disconnect();
      animation.onfinish = null;
      animation.cancel();
    };
  }, [reduced, reverse, seconds]);

  return (
    <div ref={root} className={cn("overflow-hidden", className)} aria-hidden="true">
      <div>
        <div ref={track} className="flex w-max flex-nowrap whitespace-nowrap will-change-transform">
          {Array.from({ length: COPIES }, (_, i) => (
            <div key={i} className="flex shrink-0 items-center">
              {children}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
