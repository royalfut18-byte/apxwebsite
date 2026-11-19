import { VelocityMarquee } from "../ui/VelocityMarquee";

const WORDS = ["Websites", "SEO", "Instagram", "Custom tools"];

/** The four things APX does, on a loop, between the hero and the services. */
export function Ticker() {
  return (
    <div className="border-b border-white/[0.07] py-7 md:py-10">
      <VelocityMarquee>
        {WORDS.map((word, i) => (
          <span key={word} className="flex items-center">
            <span className={`display px-6 text-[clamp(2.75rem,8vw,7.5rem)] md:px-10 ${i % 2 ? "text-outline" : "text-bone"}`}>
              {word}
            </span>
            <svg viewBox="0 0 56 56" className="h-[clamp(1.5rem,3.6vw,3.25rem)] w-auto shrink-0 text-ember" fill="none" aria-hidden="true">
              <path d="M2.15 64 L28 12.3 L53.85 64" stroke="currentColor" strokeWidth="11" strokeLinejoin="miter" />
            </svg>
          </span>
        ))}
      </VelocityMarquee>
    </div>
  );
}
