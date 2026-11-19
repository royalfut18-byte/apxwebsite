"use client";

import { motion, type Variants } from "framer-motion";
import { Fragment } from "react";

import { cn, ease } from "@/lib/cn";

type Tag = "h1" | "h2" | "h3" | "p" | "span" | "div";

type RevealTextProps = {
  /**
   * The text to show. Wrap a word in asterisks to set it in the italic serif accent,
   * e.g. "Real businesses. *Live* sites."
   * "\n" forces a line break everywhere; "|" breaks on tablet and up only, and
   * lets the line wrap naturally on phones.
   */
  text: string;
  as?: Tag;
  className?: string;
  /** Seconds before the first word moves. */
  delay?: number;
  /** Seconds between words. */
  stagger?: number;
  /**
   * Leave undefined to reveal when scrolled into view. Pass a boolean to
   * control it yourself (the hero waits for the intro this way).
   */
  show?: boolean;
  id?: string;
};

const word: Variants = {
  hidden: { y: "108%", rotate: 4 },
  shown: { y: "0%", rotate: 0, transition: { duration: 1, ease: ease.expo } },
};

/**
 * Headline reveal. Each word rises out of its own mask, staggered, so the effect
 * holds up however the line wraps on a given screen. The words stay real text
 * in the DOM, so search engines and screen readers get the full sentence.
 */
export function RevealText({
  text,
  as = "h2",
  className,
  delay = 0,
  stagger = 0.055,
  show,
  id,
}: RevealTextProps) {
  const MotionTag = motion[as] as typeof motion.div;
  // Split into lines, remembering which kind of break came before each one.
  const lines = text.split(/(?=[\n|])/).map((part, i) => ({
    soft: i > 0 && part.startsWith("|"),
    words: (i > 0 ? part.slice(1) : part).split(" ").filter(Boolean),
  }));

  const controlled = show !== undefined;
  const container: Variants = {
    hidden: {},
    shown: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };

  return (
    <MotionTag
      id={id}
      className={className}
      variants={container}
      initial="hidden"
      {...(controlled
        ? { animate: show ? "shown" : "hidden" }
        : { whileInView: "shown", viewport: { once: true, margin: "0px 0px -12% 0px" } })}
    >
      {lines.map((line, li) => (
        <Fragment key={li}>
          {li > 0 &&
            (line.soft ? (
              <>
                {" "}
                <br className="max-md:hidden" />
              </>
            ) : (
              <br />
            ))}
          {line.words.map((raw, wi) => {
            const isAccent = /^\*.+\*[.,!?]?$/.test(raw);
            const clean = raw.replace(/\*/g, "");
            return (
              <Fragment key={`${li}-${wi}`}>
                {wi > 0 && " "}
                <span
                  data-reveal=""
                  className={cn(
                    "inline-block overflow-hidden align-bottom",
                    // Room for descenders and the slant of the italic, clawed back with margins.
                    isAccent
                      ? "-mx-[0.06em] -mb-[0.18em] px-[0.06em] pb-[0.18em]"
                      : "-mb-[0.14em] pb-[0.14em]",
                  )}
                >
                  <motion.span
                    data-reveal=""
                    variants={word}
                    className={cn(
                      "inline-block origin-bottom-left will-change-transform",
                      isAccent && "accent",
                    )}
                  >
                    {clean}
                  </motion.span>
                </span>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </MotionTag>
  );
}
