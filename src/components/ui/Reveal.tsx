"use client";

import { motion, useReducedMotion, type TargetAndTransition } from "framer-motion";

import { ease } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distance travelled, in pixels. */
  y?: number;
  /** Controlled mode, as in RevealText. */
  show?: boolean;
  /**
   * Reveal with a wipe from the top edge down instead of a fade. The content is fully
   * opaque from the first frame, so text is never caught half-transparent.
   */
  wipe?: boolean;
  as?: "div" | "p" | "li" | "span";
};

const CLOSED = "inset(0% 0% 100% 0%)";
const OPEN = "inset(0% 0% 0% 0%)";

/**
 * Fade and rise (or wipe and rise). The workhorse for body copy, labels and cards.
 * Only `transform`, `opacity` and `clip-path` are animated, all of which the browser
 * runs on its compositor.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  show,
  wipe = false,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  // Reduced motion: a plain fade, with no travel and no wipe. The transform and the clip
  // are still named (as "none") so they replace the starting values in the server's HTML.
  const still = useReducedMotion();
  const from = `translateY(${y}px)`;
  const hidden: TargetAndTransition = still
    ? { opacity: 0, transform: "none", clipPath: "none" }
    : wipe
      ? { clipPath: CLOSED, transform: from }
      : { opacity: 0, transform: from };
  // Once finished, the clip and the transform are dropped, so focus rings and hover
  // effects are not cut off and the element is back to an ordinary box.
  const shown: TargetAndTransition = still
    ? { opacity: 1, transform: "none", clipPath: "none" }
    : wipe
      ? {
          clipPath: OPEN,
          transform: "translateY(0px)",
          transitionEnd: { clipPath: "none", transform: "none" },
        }
      : { opacity: 1, transform: "translateY(0px)", transitionEnd: { transform: "none" } };
  const transition = still
    ? {
        duration: 0.6,
        ease: "easeOut" as const,
        delay,
        transform: { duration: 0 },
        clipPath: { duration: 0 },
      }
    : { duration: 1, ease: ease.expo, delay };
  const controlled = show !== undefined;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial={hidden}
      transition={transition}
      {...(controlled
        ? { animate: show ? shown : hidden }
        : { whileInView: shown, viewport: { once: true, margin: "0px 0px -10% 0px" } })}
    >
      {children}
    </MotionTag>
  );
}
