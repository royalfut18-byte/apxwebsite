import type { Metadata } from "next";
import { preload } from "react-dom";

import { Aurora } from "@/components/Aurora";
import { BookingPanel } from "@/components/booking/BookingPanel";
import { Button } from "@/components/ui/Button";
import { CALL_MINUTES } from "@/lib/booking";
import { site } from "@/lib/site";

const title = `Book a ${CALL_MINUTES}-minute call`;
const description = `Pick a time for a free ${CALL_MINUTES}-minute call with ${site.name} about a website, SEO, Instagram or a custom tool for your business. We ring you.`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/book" },
  openGraph: { title: `${title} | ${site.name}`, description, url: `${site.url}/book` },
  twitter: { title: `${title} | ${site.name}`, description },
};

/**
 * apxs.com.au/book: straight to picking a time for a short call, with no intro. The times
 * come from APECS, and each booking lands in its calendar as a call (see lib/calls.ts).
 * "See the main site" is a full page load, so the home page plays its intro as usual.
 */
export default function BookPage() {
  // Ask for the free times straight away, while the page's code is still on its way.
  preload("/api/book/slots", { as: "fetch", crossOrigin: "anonymous" });

  return (
    <main id="main" className="relative min-h-[100svh] overflow-hidden">
      {/* The site's light, behind the heading. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[46rem]">
        <Aurora className="absolute inset-0" seed={4} focus={[0.82, 0.22]} reach={[0.75, 0.62]} gain={0.8} />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(7,7,8,0.1)_0%,rgba(7,7,8,0.55)_55%,var(--color-ink)_100%)]" />
      </div>

      <div className="shell relative pb-20 pt-32 md:pb-28 md:pt-44">
        <div className="mb-12 grid gap-10 md:mb-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="label book-rise flex items-center gap-3 text-mute">
              <span className="text-ember">{CALL_MINUTES} min</span>
              <span className="h-px w-8 bg-white/20" />
              Free call
            </p>
            <h1 className="display book-rise mt-6 text-[clamp(3rem,8.4vw,8rem)] text-bone [animation-delay:70ms]">
              Book a quick <span className="accent">call.</span>
            </h1>
            <p className="book-rise mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-bone-dim [animation-delay:140ms] md:text-lg">
              Pick a time that suits you and we&rsquo;ll ring you for a quick {CALL_MINUTES}-minute chat. No
              prep, no hard sell: just your business and what would help it most.
            </p>
          </div>
          <div className="book-rise flex flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:200ms] lg:col-span-4 lg:justify-end">
            {/* A plain link, so the home page loads fresh and plays its intro. */}
            <Button href="/" variant="ghost">
              See the main site
            </Button>
          </div>
        </div>

        <noscript>
          <p className="mb-8 max-w-xl rounded-2xl border border-white/10 bg-ink-800 px-5 py-4 text-bone-dim">
            Booking needs JavaScript switched on. Or email{" "}
            <a
              href={`mailto:${site.email}`}
              className="text-bone underline decoration-ember underline-offset-4"
            >
              {site.email}
            </a>{" "}
            with a couple of times that suit you.
          </p>
        </noscript>

        <BookingPanel />

        <p className="book-rise mt-8 text-[0.9375rem] text-faint [animation-delay:320ms]">
          Rather write?{" "}
          <a href={`mailto:${site.email}`} className="link-sweep pb-0.5 text-bone-dim hover:text-bone">
            {site.email}
          </a>
        </p>
      </div>
    </main>
  );
}
