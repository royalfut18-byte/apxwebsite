import { useCallback, useEffect, useRef } from "react";

/**
 * Tilts an element toward the mouse, like a card held in the hand, and moves a soft
 * highlight across it. Give the element the `tilt` class (globals.css) and spread the
 * returned handlers onto it; put a `<span className="tilt-glare" />` inside for the highlight.
 *
 * The angle is handed to CSS as custom properties and smoothed by a CSS transition, so
 * script only runs when the mouse actually moves. Mouse only: on touch screens, and for
 * visitors who ask for reduced motion, nothing tilts.
 */
export function useTilt<T extends HTMLElement>(ref: React.RefObject<T | null>, maxDeg = 5) {
  const frame = useRef(0);
  const at = useRef({ x: 0, y: 0 });

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      at.current = { x: e.clientX, y: e.clientY };
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const px = Math.min(1, Math.max(0, (at.current.x - rect.left) / rect.width));
        const py = Math.min(1, Math.max(0, (at.current.y - rect.top) / rect.height));
        el.style.setProperty("--tilt-x", `${((0.5 - py) * 2 * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--tilt-y", `${((px - 0.5) * 2 * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
      });
    },
    [ref, maxDeg],
  );

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }, [ref]);

  return { onPointerMove, onPointerLeave };
}
