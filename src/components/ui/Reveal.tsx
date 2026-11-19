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
  as?: "div" | "p" | "li" | "span";
};

/** Fade and rise. The workhorse for body copy, labels and cards. */
export function Reveal({ children, className, delay = 0, y = 28, show, as = "div" }: RevealProps) {
  const MotionTag = motion[as] as typeof motion.div;
  const hidden = { opacity: 0, y };
  const shown = { opacity: 1, y: 0 };
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
