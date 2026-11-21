import { VelocityMarquee } from "../ui/VelocityMarquee";

const WORDS = ["Websites", "SEO", "Instagram", "Custom tools"];

/** Two rows that pass each other: the same four words, travelling in opposite directions. */
const ROWS = [
  { words: WORDS, seconds: 30, reverse: false, solid: 0 },
  { words: [...WORDS.slice(2), ...WORDS.slice(0, 2)], seconds: 37, reverse: true, solid: 1 },
];

/** The four things APXS does, on a loop, between the hero and the services. */
export function Ticker() {
  return (
    <div className="border-b border-white/[0.07] py-6 md:py-9">
      {ROWS.map((row) => (
        <VelocityMarquee key={row.seconds} seconds={row.seconds} reverse={row.reverse}>
          {row.words.map((word, i) => (
            <span key={word} className="flex items-center">
              <span
                // The padding gives descenders room inside the row's clipped edge.
                className={`display px-5 py-[0.09em] text-[clamp(2.5rem,7.4vw,7rem)] md:px-9 ${i % 2 === row.solid ? "text-bone" : "text-outline"}`}
              >
                {word}
              </span>
              <svg
                viewBox="0 0 56 56"
                className="h-[clamp(1.35rem,3.3vw,3rem)] w-auto shrink-0 text-ember"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2.15 64 L28 12.3 L53.85 64"
                  stroke="currentColor"
                  strokeWidth="11"
                  strokeLinejoin="miter"
                />
              </svg>
            </span>
          ))}
        </VelocityMarquee>
      ))}
    </div>
  );
}
