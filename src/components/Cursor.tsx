"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Mode = "idle" | "hover" | "label" | "hidden";

const INTERACTIVE = "[data-cursor], a, button, [role='button'], summary, label";
const TEXT_FIELDS = "input, textarea, select, [contenteditable='true']";

/**
 * A follower that trails the real cursor: a small ember dot that opens into a ring
 * over anything clickable, and into a labelled disc where an element asks for one
 * with `data-cursor="label" data-cursor-label="Visit site"`.
 *
 * Mouse only. The system cursor is never hidden, so nothing is lost if this is.
 */
export function Cursor() {
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduced = useReducedMotion();
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 480, damping: 38, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 480, damping: 38, mass: 0.5 });
  const [mode, setMode] = useState<Mode>("hidden");
  const [label, setLabel] = useState("");

  const enabled = fine && !reduced;

  useEffect(() => {
    if (!enabled) return;

    function read(target: EventTarget | null) {
      const el = target instanceof Element ? target : null;
      if (!el) return setMode("idle");
      if (el.closest(TEXT_FIELDS)) return setMode("hidden");
      const hit = el.closest<HTMLElement>(INTERACTIVE);
      if (!hit) return setMode("idle");
      if (hit.dataset.cursor === "none") return setMode("hidden");
      if (hit.dataset.cursor === "label" && hit.dataset.cursorLabel) {
        setLabel(hit.dataset.cursorLabel);
        return setMode("label");
      }
      setMode("hover");
    }

    // Whether the mouse is over the page at the moment.
    let present = false;
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      present = true;
      x.set(e.clientX);
      y.set(e.clientY);
      read(e.target);
    }
    const onLeave = () => {
      present = false;
      setMode("hidden");
    };
    // The page can move under a mouse that is holding still. While it scrolls, look again at
    // what is beneath the pointer a few times a second, so the follower never goes on
    // describing something that has scrolled away.
    let recheck = 0;
    const onScroll = () => {
      if (!present || recheck) return;
      recheck = window.setTimeout(() => {
        recheck = 0;
        if (present) read(document.elementFromPoint(x.get(), y.get()));
      }, 120);
    };
    const onDown = () => document.documentElement.style.setProperty("--cursor-press", "0.86");
    const onUp = () => document.documentElement.style.setProperty("--cursor-press", "1");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(recheck);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size = mode === "label" ? 104 : mode === "hover" ? 46 : 9;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90]"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{ scale: "var(--cursor-press, 1)" }}
        initial={false}
        animate={{
          width: size,
          height: size,
          opacity: mode === "hidden" ? 0 : 1,
          backgroundColor: mode === "hover" ? "rgba(255, 91, 46, 0)" : "rgba(255, 91, 46, 1)",
          borderColor: mode === "hover" ? "rgba(241, 238, 231, 0.75)" : "rgba(241, 238, 231, 0)",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.5 }}
      >
        <span className="pointer-events-none absolute inset-0 rounded-full border border-inherit" />
        <AnimatePresence>
          {mode === "label" && (
            <motion.span
              key={label}
              className="whitespace-nowrap px-2 text-center text-[0.8125rem] font-semibold leading-none tracking-tight text-ink"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.25 }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
