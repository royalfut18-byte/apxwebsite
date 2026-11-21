"use client";

import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { useIsClient } from "@/hooks/useIsClient";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { applyMotion, currentMotion } from "@/lib/motion";

/**
 * The page has three states on load:
 *   intro   the curtain is down and the opening sequence is playing
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
  /**
   * True a little before `ready`, while the curtain is still down: the moment to get the
   * heavy things behind it into place, so that less has to happen as it lifts.
   */
  primed: boolean;
  prime: () => void;
  /** True when there is no intro at all on this page load (a deep link, or any page but home). */
  skipped: boolean;
  /** The animations are turned down (see lib/motion.ts): the intro still plays, as a simple fade. */
  reduced: boolean;
  setPhase: (phase: IntroPhase) => void;
};

const IntroContext = createContext<IntroContextValue>({
  phase: "done",
  ready: true,
  primed: true,
  prime: () => {},
  skipped: false,
  reduced: false,
  setPhase: () => {},
});

const noop = () => () => {};

/** The fragment the page was opened with, e.g. "contact" for /#contact. Fixed for the life of the page. */
let landedOn: string | null = null;
function landingTarget() {
  if (landedOn === null) landedOn = decodeURIComponent(window.location.hash.slice(1));
  return landedOn;
}

/** If the opening sequence ever stalls, the curtain lifts anyway after this long. */
const WATCHDOG_MS = 12_000;

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [requested, setRequested] = useState<IntroPhase>("intro");
  const setPhase = useCallback((next: IntroPhase) => setRequested(next), []);
  const [early, setEarly] = useState(false);
  const prime = useCallback(() => setEarly(true), []);

  // The intro plays on every visit to the home page. It is skipped only for someone
  // arriving on a deep link such as /#contact, who should land on what they asked for,
  // and on pages other than the home page.
  const reduced = useReducedMotion();
  // Framer Motion fixes each element's reduced-motion setting when the element is created,
  // which for most of the page is the very first render in the browser. `reduced` is not
  // known to React yet at that point (it has to match the server's HTML first), so that one
  // render reads the answer directly. Nothing drawn depends on it, so nothing can mismatch.
  const [reducedAtFirst] = useState(() => typeof window !== "undefined" && currentMotion() === "reduced");
  const still = useIsClient() ? reduced : reducedAtFirst;
  const target = useSyncExternalStore(noop, landingTarget, () => "");
  const home = usePathname() === "/";
  const skipped = Boolean(target) || !home;
  const phase: IntroPhase = skipped ? "done" : requested;

  // The script in <head> has already told the stylesheet how much may move. This repeats it,
  // because in development React rebuilds <html> once and drops what that script wrote.
  useLayoutEffect(() => {
    applyMotion();
  }, []);

  // Keep the page still while the curtain is down.
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (phase === "intro") {
      root.classList.add("is-locked");
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      root.classList.remove("is-locked");
    }
    return () => root.classList.remove("is-locked");
  }, [phase]);

  // A page must never stay hidden behind its own intro. Only time spent on screen counts,
  // though: a tab opened in the background has not played its intro yet (the sequence
  // waits for the tab to be looked at), and must still have it when the visitor arrives.
  useEffect(() => {
    if (phase !== "intro") return;
    let id = 0;
    const arm = () => {
      window.clearTimeout(id);
      if (document.visibilityState === "visible") {
        id = window.setTimeout(() => setRequested("reveal"), WATCHDOG_MS);
      }
    };
    arm();
    document.addEventListener("visibilitychange", arm);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("visibilitychange", arm);
    };
  }, [phase]);

  // Deep link: once the page is unlocked, go to the section that was asked for.
  useLayoutEffect(() => {
    if (!target) return;
    document.getElementById(target)?.scrollIntoView({ behavior: "instant" });
  }, [target]);

  const value = useMemo(
    () => ({
      phase,
      ready: phase !== "intro",
      primed: early || phase !== "intro",
      prime,
      skipped,
      reduced,
      setPhase,
    }),
    [phase, early, prime, skipped, reduced, setPhase],
  );

  return (
    <IntroContext.Provider value={value}>
      {/* "always": with the animations turned down, movement is dropped and only fades remain. */}
      <MotionConfig reducedMotion={still ? "always" : "never"}>{children}</MotionConfig>
    </IntroContext.Provider>
  );
}

export function useIntro() {
  return useContext(IntroContext);
}
