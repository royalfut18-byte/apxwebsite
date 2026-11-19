"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";

/**
 * The page has three states on load:
 *   intro   the curtain is down and the wordmark is drawing
 *   reveal  the curtain is lifting; the hero starts its entrance
 *   done    the curtain is gone
 *
 * Anything that should wait for the curtain reads `ready` from here.
 */
export type IntroPhase = "intro" | "reveal" | "done";

type IntroContextValue = {
  phase: IntroPhase;
  /** True once the hero may start animating in. */
  ready: boolean;
  setPhase: (phase: IntroPhase) => void;
};

const IntroContext = createContext<IntroContextValue>({
  phase: "done",
  ready: true,
  setPhase: () => {},
});

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [requested, setRequested] = useState<IntroPhase>("intro");
  const setPhase = useCallback((next: IntroPhase) => setRequested(next), []);

  // Visitors who ask for reduced motion skip the intro entirely.
  // (CSS already hides the curtain for them before any script runs.)
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const phase: IntroPhase = reduced ? "done" : requested;

  // Keep the page still while the curtain is down.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (phase === "intro") {
      root.classList.add("is-locked");
      window.scrollTo(0, 0);
    } else {
      root.classList.remove("is-locked");
    }
    return () => root.classList.remove("is-locked");
  }, [phase]);

  const value = useMemo(() => ({ phase, ready: phase !== "intro", setPhase }), [phase, setPhase]);

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro() {
  return useContext(IntroContext);
}
