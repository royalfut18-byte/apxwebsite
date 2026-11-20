"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Shared plumbing for the service demos: they only run while on screen, and
 * hold a finished still for visitors who prefer reduced motion.
 */
export function useDemo<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotion();
  return { ref, playing: inView && !reduced, reduced };
}
