/** Joins class names, skipping anything falsy. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** The site's signature easing curves, as cubic-bezier tuples for Framer Motion. */
export const ease = {
  expo: [0.16, 1, 0.3, 1],
  quart: [0.25, 1, 0.5, 1],
  swift: [0.76, 0, 0.24, 1],
  inOut: [0.65, 0, 0.35, 1],
  /** Overshoots a touch before settling: for things that pop in. */
  back: [0.34, 1.56, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;
