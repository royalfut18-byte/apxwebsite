"use client";

import { useEffect, useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

type VelocityMarqueeProps = {
  children: React.ReactNode;
  /** Seconds for one full pass at rest. */
  seconds?: number;
  className?: string;
};

const COPIES = 4;

/**
 * An endless ticker that speeds up with the scroll and runs backwards when you
 * scroll back up.
 *
 * The movement is a single looping animation that the browser runs on its compositor,
 * so it costs nothing per frame. Scrolling only nudges its playback rate. It pauses
 * whenever it is off screen.
 */
export function VelocityMarquee({ children, seconds = 26, className }: VelocityMarqueeProps) {
  const track = useRef<HTMLDivElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const el = track.current;
    if (!el || reduced || typeof el.animate !== "function") return;

    // One copy is 100 / COPIES percent of the track, so looping there is seamless.
    const animation = el.animate(
      [{ transform: "translateX(0%)" }, { transform: `translateX(-${100 / COPIES}%)` }],
      { duration: seconds * 1000, iterations: Infinity, easing: "linear" },
    );
    animation.pause();

    let visible = false;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) animation.play();
      else animation.pause();
    });
    io.observe(el);

    let lastY = window.scrollY;
    let lastT = performance.now();
    let direction = 1;
    let settle = 0;
    const onScroll = () => {
      const now = performance.now();
      const dy = window.scrollY - lastY;
      const dt = Math.max(16, now - lastT);
      lastY = window.scrollY;
      lastT = now;
      if (!visible || dy === 0) return;
      direction = dy < 0 ? -1 : 1;
      const boost = Math.min(5, (Math.abs(dy) / dt) * 2.4);
      animation.updatePlaybackRate(direction * (1 + boost));
      window.clearTimeout(settle);
      settle = window.setTimeout(() => animation.updatePlaybackRate(direction), 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(settle);
      io.disconnect();
      animation.cancel();
    };
  }, [reduced, seconds]);

  return (
    <div className={cn("overflow-hidden", className)} aria-hidden="true">
      <div ref={track} className="flex w-max flex-nowrap whitespace-nowrap will-change-transform">
        {Array.from({ length: COPIES }, (_, i) => (
          <div key={i} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
