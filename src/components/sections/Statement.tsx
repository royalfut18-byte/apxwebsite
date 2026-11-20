"use client";

import { useMotionValueEvent, useScroll } from "framer-motion";
import { useRef, useState } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

import { Reveal } from "../ui/Reveal";
import { Rule } from "../ui/Rule";

// Asterisks mark the words set in the accent, as in the headlines.
const TEXT =
  "Most businesses end up with one person for the website, another for Google and someone else for Instagram. None of them talk to each other. We do the lot, so everything pulls the same way: *up.*";
const WORDS = TEXT.split(" ");

/**
 * The pitch, in one paragraph. Words light up as you read down the page.
 *
 * Scrolling only ever changes one number (how many words are lit). Each word then
 * fades itself with a CSS transition, so nothing is recalculated frame by frame.
 */
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.82", "end 0.5"] });
  const [lit, setLit] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.round(Math.min(1, Math.max(0, v)) * (WORDS.length + 2));
    setLit((current) => (current === next ? current : next));
  });

  return (
    <section aria-label="Why one team" className="shell py-28 md:py-48">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <Reveal y={14} className="lg:col-span-3">
          <p className="label flex items-center gap-3 text-mute lg:sticky lg:top-32">
            <span className="text-ember">03</span>
            <Rule className="bg-white/20" />
            Why one team
          </p>
        </Reveal>
        <p
          ref={ref}
          className="display text-[clamp(1.85rem,4.7vw,5.1rem)] leading-[1.03] text-bone lg:col-span-9"
        >
          {WORDS.map((word, i) => {
            const accent = word.startsWith("*");
            const on = reduced || i < lit;
            return (
              <span
                key={`${word}-${i}`}
                data-reveal=""
                className={cn(
                  "transition-opacity duration-500 ease-out",
                  accent && "accent",
                  // Unlit words stay readable (above 3:1 for type this size); they brighten
                  // rather than appear. The ember word starts brighter, being darker to begin with.
                  on ? "opacity-100" : accent ? "opacity-70" : "opacity-40",
                )}
              >
                {word.replace(/\*/g, "")}{" "}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
