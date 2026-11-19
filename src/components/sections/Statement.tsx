"use client";

import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";

import { Reveal } from "../ui/Reveal";

// Asterisks mark the words set in the accent, as in the headlines.
const TEXT =
  "Most businesses end up with one person for the website, another for Google and someone else for Instagram. None of them talk to each other. We do the lot, so everything pulls the same way: *up.*";

function Word({
  word,
  progress,
  range,
  still,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
  still: boolean;
}) {
  const accent = word.startsWith("*");
  // Unlit words stay readable (above 3:1 for type this size); they brighten rather than appear.
  // The ember word starts brighter, because the colour is darker to begin with.
  const opacity = useTransform(progress, range, [accent ? 0.72 : 0.4, 1]);
  return (
    <motion.span data-reveal="" style={{ opacity: still ? 1 : opacity }} className={cn(accent && "accent")}>
      {word.replace(/\*/g, "")}{" "}
    </motion.span>
  );
}

/** The pitch, in one paragraph. Each word lights up as you read down the page. */
export function Statement() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.82", "end 0.5"] });
  const words = TEXT.split(" ");

  return (
    <section aria-label="Why one team" className="shell py-28 md:py-48">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
        <Reveal y={14} className="lg:col-span-3">
          <p className="label flex items-center gap-3 text-mute lg:sticky lg:top-32">
            <span className="text-ember">03</span>
            <span className="h-px w-8 bg-white/20" />
            Why one team
          </p>
        </Reveal>
        <p
          ref={ref}
          className="display text-[clamp(1.85rem,4.7vw,5.1rem)] leading-[1.03] text-bone lg:col-span-9"
        >
          {words.map((word, i) => {
            // Each word fades up over a short window, a few words overlapping at a time.
            const start = i / words.length;
            const end = Math.min(1, start + 3.5 / words.length);
            return (
              <Word
                key={`${word}-${i}`}
                word={word}
                progress={scrollYProgress}
                range={[start, end]}
                still={reduced}
              />
            );
          })}
        </p>
      </div>
    </section>
  );
}
