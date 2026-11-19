"use client";

import { motion } from "framer-motion";

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

/** Fade and rise (or wipe and rise). The workhorse for body copy, labels and cards. */
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
  const hidden = wipe ? { clipPath: CLOSED, y } : { opacity: 0, y };
  // Once a wipe has finished the clip is dropped, so focus rings and hover effects are not cut off.
  const shown = wipe ? { clipPath: OPEN, y: 0, transitionEnd: { clipPath: "none" } } : { opacity: 1, y: 0 };
  const controlled = show !== undefined;

  return (
    <MotionTag
      data-reveal=""
      className={className}
      initial={hidden}
      transition={{ duration: 1, ease: ease.expo, delay }}
      {...(controlled
        ? { animate: show ? shown : hidden }
        : { whileInView: shown, viewport: { once: true, margin: "0px 0px -10% 0px" } })}
    >
      {children}
    </MotionTag>
  );
}
