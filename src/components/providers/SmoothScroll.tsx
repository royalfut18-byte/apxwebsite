"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { useIntro } from "./IntroProvider";

/** The one Lenis instance, for the few places that need to scroll programmatically. */
export const scroller: { current: Lenis | null } = { current: null };

/** Scroll to an element, a selector or a pixel offset, with or without smoothing. */
export function scrollToTarget(target: string | number | HTMLElement) {
  if (scroller.current) {
    scroller.current.scrollTo(target, { offset: 0 });
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target });
  } else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView();
  }
}

/**
 * Momentum scrolling. Lenis drives the native scroll position, so sticky
 * positioning, anchors and scroll-linked animation all keep working, and it
 * steps aside by itself for visitors who prefer reduced motion.
 */
export function SmoothScroll() {
  const { phase } = useIntro();

  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      lerp: 0.11,
      wheelMultiplier: 1,
      stopInertiaOnNavigate: true,
    });
    scroller.current = lenis;
    return () => {
      lenis.destroy();
      scroller.current = null;
    };
  }, []);

  useEffect(() => {
    const lenis = scroller.current;
    if (!lenis) return;
    if (phase === "intro") lenis.stop();
    else lenis.start();
  }, [phase]);

  return null;
}
