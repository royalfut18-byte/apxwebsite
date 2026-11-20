"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

import { useIsClient } from "@/hooks/useIsClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { nav, site } from "@/lib/site";

import { Logo } from "../Logo";
import { scrollToTarget } from "@/lib/scroll";
import { LocalTime } from "../ui/LocalTime";

// The year the site was built: what the server renders before the browser knows today's date.
const BUILD_YEAR = 2026;

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const markSeen = useInView(markRef, { once: true, amount: 0.4 });
  const isClient = useIsClient();
  const year = isClient ? Math.max(BUILD_YEAR, new Date().getFullYear()) : BUILD_YEAR;

  // The wordmark rises into place as the footer comes into view.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const markY = useTransform(scrollYProgress, [0, 1], ["22%", "0%"]);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  return (
    <footer ref={ref} className="relative overflow-hidden border-t border-white/[0.07] bg-ink">
      <div className="shell pt-16 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-6">
            <p className="display max-w-xl text-[clamp(1.6rem,2.8vw,2.6rem)] leading-[1.05] text-bone">
              Websites, SEO, Instagram and custom tools for businesses that want to be{" "}
              <span className="accent">found.</span>
            </p>
          </div>

          <nav aria-label="Footer" className="md:col-span-3 md:col-start-8">
            <p className="label mb-5 text-mute">Explore</p>
            <ul className="grid gap-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="link-sweep pb-0.5 text-lg font-medium text-bone-dim hover:text-bone"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <p className="label mb-5 text-mute">Say hello</p>
            <ul className="grid gap-2.5">
              <li>
                <a
                  href={`mailto:${site.email}`}
                  className="link-sweep pb-0.5 text-lg font-medium text-bone-dim hover:text-bone"
                >
                  Email
                </a>
              </li>
              {site.phone ? (
                <li>
                  <a
                    href={`tel:${site.phone.replace(/\s+/g, "")}`}
                    className="link-sweep pb-0.5 text-lg font-medium text-bone-dim hover:text-bone"
                  >
                    Call
                  </a>
                </li>
              ) : null}
              {site.instagram ? (
                <li>
                  <a
                    href={`https://www.instagram.com/${site.instagram}`}
                    target="_blank"
                    rel="noopener"
                    className="link-sweep pb-0.5 text-lg font-medium text-bone-dim hover:text-bone"
                  >
                    Instagram
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {/* The wordmark, as big as the page allows. It draws itself on arrival. */}
        <motion.div
          ref={markRef}
          className="mt-16 text-bone will-change-transform md:mt-24"
          style={{ y: reduced ? 0 : markY }}
        >
          <Logo draw play={markSeen} className="block h-auto w-full" title={site.name} />
        </motion.div>
      </div>

      <div className="relative border-t border-white/[0.07] bg-ink">
        <div className="shell flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
          <p className="label text-mute">
            &copy; <span suppressHydrationWarning>{year}</span> {site.legalName}
            <span className="mx-3 text-faint">/</span>
            {site.location}
            <span className="mx-3 text-faint">/</span>
            <LocalTime />
          </p>
          <button
            type="button"
            onClick={() => scrollToTarget(0)}
            className="label group flex w-fit items-center gap-2 text-mute transition-colors duration-300 hover:text-bone"
          >
            Back to top
            <svg
              viewBox="0 0 12 12"
              className="h-3 w-3 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-1"
              fill="none"
              aria-hidden="true"
            >
              <path d="M6 11V1M1.5 5.5 6 1l4.5 4.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
