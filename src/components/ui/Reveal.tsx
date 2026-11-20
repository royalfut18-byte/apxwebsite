"use client";

import { motion, type TargetAndTransition } from "framer-motion";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { ease } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Distance travelled upward into place, in pixels. */
  y?: number;
  /** Distance travelled sideways, in pixels. Negative arrives from the left. */
  x?: number;
  /** Swing in from one side, turning to face the visitor, instead of rising. */
  swing?: "left" | "right";
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
 * Fade and rise (or wipe and rise, or slide in from a side, or swing in in 3D). The
 * workhorse for body copy, labels and cards. Only `transform`, `opacity` and `clip-path`
 * are animated, all of which the browser runs on its compositor.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  x = 0,
  swing,
  show,
  wipe = false,
  as = "div",
}: RevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  // Reduced motion: a plain fade, with no travel and no wipe. The transform and the clip
  // are still named (as "none") so they replace the starting values in the server's HTML.
  const still = useReducedMotion();
  // Each pair is the same list of functions with different numbers, which is what lets
  // the browser run the change itself.
  const side = swing === "left" ? -1 : 1;
  const from = swing
    ? `perspective(1400px) translateX(${side * 9}%) rotateY(${side * 20}deg)`
    : `translate(${x}px, ${y}px)`;
  const to = swing ? "perspective(1400px) translateX(0%) rotateY(0deg)" : "translate(0px, 0px)";
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
          transform: to,
          transitionEnd: { clipPath: "none", transform: "none" },
        }
      : { opacity: 1, transform: to, transitionEnd: { transform: "none" } };
  const transition = still
    ? {
        duration: 0.6,
        ease: "easeOut" as const,
        delay,
        transform: { duration: 0 },
        clipPath: { duration: 0 },
      }
    : { duration: swing ? 1.25 : 1, ease: ease.expo, delay };
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
