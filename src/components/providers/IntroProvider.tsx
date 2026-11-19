"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

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
  /** True when the intro is being bypassed altogether, so it should vanish rather than animate away. */
  skipped: boolean;
  setPhase: (phase: IntroPhase) => void;
};

const IntroContext = createContext<IntroContextValue>({
  phase: "done",
  ready: true,
  skipped: false,
  setPhase: () => {},
});

const noop = () => () => {};

/** The fragment the page was opened with, e.g. "contact" for /#contact. Fixed for the life of the page. */
let landedOn: string | null = null;
function landingTarget() {
  if (landedOn === null) landedOn = decodeURIComponent(window.location.hash.slice(1));
  return landedOn;
}

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [requested, setRequested] = useState<IntroPhase>("intro");
  const setPhase = useCallback((next: IntroPhase) => setRequested(next), []);

  // The intro is skipped entirely for visitors who ask for reduced motion (CSS already
  // hides the curtain for them before any script runs), for anyone arriving on a deep
  // link such as /#contact, who should land on what they asked for, and on every page
  // other than the home page.
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const target = useSyncExternalStore(noop, landingTarget, () => "");
  const home = usePathname() === "/";
  const skipped = reduced || Boolean(target) || !home;
  const phase: IntroPhase = skipped ? "done" : requested;

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

  // Deep link: once the page is unlocked, go to the section that was asked for.
  useLayoutEffect(() => {
    if (!target) return;
    document.getElementById(target)?.scrollIntoView();
  }, [target]);

  const value = useMemo(
    () => ({ phase, ready: phase !== "intro", skipped, setPhase }),
    [phase, skipped, setPhase],
  );

  return (
    <IntroContext.Provider value={value}>
      {/* "user": for visitors who ask for reduced motion, movement is dropped and only fades remain. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </IntroContext.Provider>
  );
}

export function useIntro() {
  return useContext(IntroContext);
}
