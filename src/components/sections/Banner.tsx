import { VelocityMarquee } from "../ui/VelocityMarquee";

const ARROW = (
  <svg viewBox="0 0 14 14" className="h-[38%] w-[38%]" fill="none" aria-hidden="true">
    <path d="M2 12 12 2M4.5 2H12v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
  </svg>
);

const DISC =
  "grid h-[clamp(2.1rem,4.6vw,4rem)] w-[clamp(2.1rem,4.6vw,4rem)] shrink-0 place-items-center rounded-full bg-ember text-ink transition-colors duration-500 group-hover:bg-ink group-hover:text-ember group-focus-visible:bg-ink group-focus-visible:text-ember";

/**
 * A moving band on the way into the contact section. The whole band is one link: it fills
 * with ember under the pointer, and takes the visitor to the form.
 */
export function Banner() {
  return (
    <a
      href="#contact"

      className="group relative mt-16 block overflow-hidden border-y border-white/[0.07] py-4 text-bone transition-colors duration-500 hover:text-ink focus-visible:text-ink md:mt-24 md:py-6"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-700 ease-[var(--ease-expo)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
      />
      <VelocityMarquee seconds={24} className="relative">
        {[0, 1].map((n) => (
          <span key={n} className="flex items-center">
            <span className="display px-5 py-[0.09em] text-[clamp(2rem,5.4vw,4.75rem)] md:px-8">
              Got a project?
            </span>
            <span className={DISC}>{ARROW}</span>
            <span className="accent px-5 py-[0.09em] text-[clamp(2.3rem,6.2vw,5.4rem)] leading-none transition-colors duration-500 group-hover:text-ink group-focus-visible:text-ink md:px-8">
              Let&rsquo;s talk
            </span>
            <span className={DISC}>{ARROW}</span>
          </span>
        ))}
      </VelocityMarquee>
      <span className="sr-only">Start a project</span>
    </a>
  );
}
