import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Off the map",
  robots: { index: false },
};

const RINGS = [46, 92, 140, 190, 242, 296, 352, 410];

export default function NotFound() {
  return (
    <main id="main" className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Contour rings, drawn in plain SVG: this page should work with nothing else loaded. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 900 900"
        className="pointer-events-none absolute -right-[20%] top-1/2 h-[130vh] w-[130vh] -translate-y-1/2 text-bone/[0.09] md:-right-[6%]"
        fill="none"
      >
        {RINGS.map((r, i) => (
          <path
            key={r}
            d={`M ${450 - r} 450 C ${450 - r} ${450 - r * 0.62}, ${450 - r * 0.5} ${450 - r * 1.04}, ${450 + r * 0.06} ${450 - r * 0.98} S ${450 + r * 1.06} ${450 - r * 0.42}, ${450 + r} ${450 + r * 0.1} S ${450 + r * 0.44} ${450 + r * 1.02}, ${450 - r * 0.1} ${450 + r * 0.96} S ${450 - r} ${450 + r * 0.5}, ${450 - r} 450 Z`}
            stroke={i === 0 ? "var(--color-ember)" : "currentColor"}
            strokeWidth={i % 3 === 0 ? 2.5 : 1.25}
          />
        ))}
      </svg>
      <div
        aria-hidden="true"
        className="absolute right-[calc(10%-12rem)] top-1/2 h-[50rem] w-[50rem] -translate-y-1/2 bg-[radial-gradient(closest-side,rgba(255,91,46,0.155),rgba(255,91,46,0.13)_30%,rgba(255,91,46,0.075)_55%,rgba(255,91,46,0.03)_80%,transparent)]"
      />

      <div className="shell relative">
        <p className="label flex items-center gap-3 text-mute">
          <span className="text-ember">404</span>
          <span className="h-px w-8 bg-white/20" />
          Page not found
        </p>
        <h1 className="display mt-6 text-[clamp(3.15rem,10vw,10rem)] text-bone">
          Off the <span className="accent">map.</span>
        </h1>
        <p className="mt-7 max-w-md text-lg leading-relaxed text-bone-dim">
          There&rsquo;s nothing at this address. The page may have moved, or the link might be wrong.
        </p>
        <div className="mt-10">
          <Button href="/">Back to base</Button>
        </div>
      </div>
    </main>
  );
}
