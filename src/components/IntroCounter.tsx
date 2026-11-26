import { forwardRef, useImperativeHandle, useRef } from "react";

import { ease } from "@/lib/cn";

/**
 * The intro's counter, 000 to 100.
 *
 * It counts on an ease-in-out curve, showing the rounded value, exactly as an animated
 * number would. But instead of the page rewriting the number on every frame (which keeps
 * the whole page busy for as long as the intro plays), each digit place holds all ten
 * digits stacked on top of each other, and the browser's graphics card switches which one
 * shows at the right moments. Started once; nothing runs per frame.
 */

/** The ease-in-out curve the count follows, as cubic-bezier control points. */
const [X1, Y1, X2, Y2] = ease.inOut;
const bezier = (a: number, b: number) => (s: number) =>
  3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
const curveX = bezier(X1, X2);
const curveY = bezier(Y1, Y2);

/** The share of the run (0..1) at which the eased count first reaches `y` (0..1). */
function timeAt(y: number) {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (curveY(mid) < y) lo = mid;
    else hi = mid;
  }
  return curveX((lo + hi) / 2);
}

/** When each number 0..100 comes up: it is rounded, so n shows from the moment the count passes n - 0.5. */
const STARTS = Array.from({ length: 101 }, (_, n) => (n === 0 ? 0 : timeAt((n - 0.5) / 100)));

/** The digit at each place (hundreds, tens, ones) of a number. */
const PLACES = [
  { size: 2, of: (n: number) => Math.floor(n / 100) },
  { size: 10, of: (n: number) => Math.floor(n / 10) % 10 },
  { size: 10, of: (n: number) => n % 10 },
];

/** Opacity keyframes for one digit at one place: shown while the number has it there. */
function keyframesFor(place: (typeof PLACES)[number], digit: number): Keyframe[] {
  const frames: Keyframe[] = [];
  let shown: boolean | null = null;
  for (let n = 0; n <= 100; n++) {
    const now = place.of(n) === digit;
    if (now === shown) continue;
    shown = now;
    // "step-end": each value holds until the next keyframe, then switches outright.
    frames.push({ offset: STARTS[n], opacity: now ? 1 : 0, easing: "step-end" });
  }
  frames.push({ offset: 1, opacity: shown ? 1 : 0 });
  return frames;
}

export type IntroCounterHandle = { start: (durationMs: number) => void; stop: () => void };

export const IntroCounter = forwardRef<IntroCounterHandle, { className?: string }>(function IntroCounter(
  { className },
  ref,
) {
  const root = useRef<HTMLSpanElement>(null);
  const running = useRef<Animation[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      start(duration) {
        const cells = root.current?.querySelectorAll<HTMLElement>("[data-place]");
        if (!cells || typeof root.current?.animate !== "function") return;
        cells.forEach((cell) => {
          const place = PLACES[Number(cell.dataset.place)];
          cell.querySelectorAll<HTMLElement>("[data-digit]").forEach((el) => {
            running.current.push(
              el.animate(keyframesFor(place, Number(el.dataset.digit)), { duration, fill: "forwards" }),
            );
          });
        });
      },
      stop() {
        running.current.forEach((a) => a.cancel());
        running.current = [];
      },
    }),
    [],
  );

  return (
    // Decorative: the curtain itself is labelled "Loading". (A number that changes a hundred
    // times would otherwise be read out over and over.)
    <span ref={root} aria-hidden="true" className={className}>
      {PLACES.map((place, p) => (
        <span key={p} data-place={p} className="relative">
          {/* Sizes the place like one more digit of the same text. */}
          <span className="invisible">0</span>
          {Array.from({ length: place.size }, (_, d) => (
            <span key={d} data-digit={d} className="absolute inset-0" style={{ opacity: d === 0 ? 1 : 0 }}>
              {d}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
});
