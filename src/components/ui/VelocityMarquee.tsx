"use client";

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "framer-motion";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

type VelocityMarqueeProps = {
  children: React.ReactNode;
  /** Base speed, in percent of one copy per second. Negative runs right to left. */
  speed?: number;
  className?: string;
};

const COPIES = 4;

/**
 * An endless ticker that speeds up with the scroll and flips direction when
 * you scroll back up. Idle while off screen.
 */
export function VelocityMarquee({ children, speed = -3.5, className }: VelocityMarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "100px" });
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 50, stiffness: 400 });
  const factor = useTransform(smoothVelocity, [0, 1000], [0, 4], { clamp: false });
  const direction = useRef(1);

  // One copy is 100 / COPIES percent of the track, so wrapping there is seamless.
  const x = useTransform(baseX, (v) => `${wrap(-100 / COPIES, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (!inView || reduced) return;
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    let moveBy = direction.current * speed * (delta / 1000);
    moveBy += direction.current * moveBy * Math.abs(f);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div ref={ref} className={cn("overflow-hidden", className)} aria-hidden="true">
      <motion.div className="flex w-max flex-nowrap whitespace-nowrap will-change-transform" style={{ x }}>
        {Array.from({ length: COPIES }, (_, i) => (
          <div key={i} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
