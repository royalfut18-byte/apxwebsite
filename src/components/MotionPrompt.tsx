"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { useIsClient } from "@/hooks/useIsClient";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { chooseMotion, chosenMotion, rememberMotion } from "@/lib/motion";

import { useIntro } from "./providers/IntroProvider";

/**
 * Offered to visitors whose device asks for reduced motion. The page is holding still for
 * them (as it should), which on this site hides a good deal: this says so, and is the way
 * to see it move. Either answer is remembered, so nobody is asked twice. Everyone can
 * change their mind later, from the foot of the page.
 */
export function MotionPrompt() {
  const { phase } = useIntro();
  const reduced = useReducedMotion();
  const isClient = useIsClient();
  const [answered, setAnswered] = useState(false);
  // Only someone who has not already said what they want here.
  const [undecided] = useState(() => typeof window !== "undefined" && chosenMotion() === null);
  const open = isClient && reduced && undecided && !answered && phase === "done";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="region"
          aria-label="Animations"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[45] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-ink-700 py-1.5 pl-5 pr-1.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.9)]">
            <p className="mr-1 text-[0.875rem] font-medium text-bone-dim">
              Animations are off<span className="max-sm:hidden"> to match your device</span>
            </p>
            <button
              type="button"
              onClick={() => chooseMotion("full")}
              className="h-11 whitespace-nowrap rounded-full bg-bone px-5 text-[0.875rem] font-semibold text-ink transition-colors duration-300 hover:bg-ember"
            >
              Turn on
            </button>
            <button
              type="button"
              aria-label="Keep animations off"
              onClick={() => {
                rememberMotion("reduced");
                setAnswered(true);
              }}
              className="grid h-11 w-11 place-items-center rounded-full text-mute transition-colors duration-300 hover:text-bone"
            >
              <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden="true">
                <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
