"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ease } from "@/lib/cn";
import { nav, site } from "@/lib/site";

import { Logo } from "./Logo";
import { useIntro } from "./providers/IntroProvider";
import { scroller } from "./providers/SmoothScroll";
import { Magnetic } from "./ui/Magnetic";

// Header items drop in behind a wipe rather than fading, so they are opaque from the first frame.
// The clip is released afterwards so focus rings and the magnetic button are not cut off.
const WIPE_HIDDEN = { clipPath: "inset(0% 0% 100% 0%)", y: -12 };
const WIPE_SHOWN = { clipPath: "inset(0% 0% 0% 0%)", y: 0, transitionEnd: { clipPath: "none" } };

export function Nav() {
  const { phase, ready } = useIntro();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lastY = useRef(0);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  // Section links are plain anchors on the home page, and lead back to it from anywhere else.
  const home = usePathname() === "/";
  const to = (hash: string) => (home ? hash : `/${hash}`);

  // Tuck the bar away on the way down, bring it back on the way up.
  useMotionValueEvent(scrollY, "change", (y) => {
    const delta = y - lastY.current;
    lastY.current = y;
    setScrolled(y > 24);
    if (y < 120) setHidden(false);
    else if (delta > 6) setHidden(true);
    else if (delta < -6) setHidden(false);
  });

  // Mobile menu: lock the page behind it, keep keyboard focus inside it, close on Escape.
  useEffect(() => {
    if (!open) return;
    scroller.current?.stop();
    document.documentElement.classList.add("is-locked");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;

      // The header (logo, close button) and the menu's links form one loop.
      const stops = [
        ...(header.current?.querySelectorAll<HTMLElement>("a[href], button") ?? []),
        ...(document.getElementById("mobile-menu")?.querySelectorAll<HTMLElement>("a[href]") ?? []),
      ].filter((el) => el.getClientRects().length > 0);
      if (stops.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const inside = active !== null && stops.includes(active);
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      scroller.current?.start();
      document.documentElement.classList.remove("is-locked");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close the menu if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const showLogo = phase !== "intro";

  return (
    <>
      <motion.header
        ref={header}
        className="fixed inset-x-0 top-0 z-[60]"
        animate={{ y: hidden && !open ? "-110%" : "0%" }}
        transition={{ duration: 0.55, ease: ease.expo }}
      >
        <div
          className={`absolute inset-0 -z-10 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ${
            scrolled && !open
              ? "border-white/[0.07] bg-ink/70 backdrop-blur-xl backdrop-saturate-150"
              : "border-transparent bg-transparent"
          }`}
        />

        <div className="shell flex h-[4.25rem] items-center justify-between md:h-20">
          <a
            href={home ? "#top" : "/"}
            aria-label={`${site.name} home`}
            className="relative block h-[18px] w-[58px] text-bone md:h-5 md:w-16"
            data-cursor="hover"
            onClick={() => setOpen(false)}
          >
            {showLogo && (
              <motion.div
                layoutId="apx-logo"
                className="absolute inset-0"
                transition={{ layout: { duration: 1.05, ease: ease.swift } }}
              >
                <Logo className="block h-full w-full" />
              </motion.div>
            )}
            {/* The logo normally arrives from the intro. Without scripts there is no intro, so show it outright. */}
            <noscript>
              <svg
                viewBox="0 0 179 56"
                className="absolute inset-0 h-full w-full"
                fill="none"
                overflow="hidden"
                aria-hidden="true"
              >
                <g stroke="currentColor" strokeWidth="11">
                  <path d="M2.15 64 L28 12.3 L53.85 64" />
                  <path d="M73.5 64 V5.5 H92 A14 14 0 0 1 92 33.5 H73.5" />
                  <path d="M121.9 -8 L178.1 64" />
                  <path d="M178.1 -8 L121.9 64" />
                </g>
              </svg>
            </noscript>
          </a>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-9">
              {nav.map((item, i) => (
                <motion.li
                  key={item.href}
                  data-reveal=""
                  initial={WIPE_HIDDEN}
                  animate={ready ? WIPE_SHOWN : WIPE_HIDDEN}
                  transition={{ duration: 0.7, ease: ease.expo, delay: ready ? 0.55 + i * 0.06 : 0 }}
                >
                  <a
                    href={to(item.href)}
                    className="link-sweep pb-1 text-[0.9375rem] font-medium text-bone-dim hover:text-bone"
                  >
                    {item.label}
                  </a>
                </motion.li>
              ))}
            </ul>
          </nav>

          <motion.div
            data-reveal=""
            className="flex items-center gap-3"
            initial={WIPE_HIDDEN}
            animate={ready ? WIPE_SHOWN : WIPE_HIDDEN}
            transition={{ duration: 0.7, ease: ease.expo, delay: ready ? 0.8 : 0 }}
          >
            <Magnetic className="hidden md:block" strength={0.25}>
              <a
                href={to("#contact")}
                className="group relative inline-flex h-11 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-bone px-5 text-[0.9375rem] font-semibold text-ink"
              >
                <span className="absolute inset-0 origin-bottom scale-y-0 bg-ember transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100" />
                <span className="relative">Start a project</span>
                <span className="relative grid h-1.5 w-1.5 place-items-center rounded-full bg-ember transition-colors duration-500 group-hover:bg-ink" />
              </a>
            </Magnetic>

            <button
              ref={toggle}
              type="button"
              className="relative grid h-11 w-11 place-items-center rounded-full border border-white/15 text-bone md:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="relative block h-3 w-5">
                <motion.span
                  className="absolute left-0 top-0 block h-[1.5px] w-full bg-current"
                  animate={open ? { y: 5.25, rotate: 45 } : { y: 0, rotate: 0 }}
                  transition={{ duration: 0.45, ease: ease.expo }}
                />
                <motion.span
                  className="absolute bottom-0 left-0 block h-[1.5px] w-full bg-current"
                  animate={open ? { y: -5.25, rotate: -45 } : { y: 0, rotate: 0 }}
                  transition={{ duration: 0.45, ease: ease.expo }}
                />
              </span>
            </button>
          </motion.div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            key="menu"
            className="fixed inset-0 z-[55] flex flex-col bg-ink md:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: ease.swift }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-ember/25 blur-[100px]"
            />
            <nav aria-label="Mobile" className="shell relative mt-28 flex-1">
              <ul>
                {nav.map((item, i) => (
                  <li key={item.href} className="overflow-hidden border-b border-white/10">
                    <motion.a
                      href={to(item.href)}
                      className="display flex items-baseline justify-between py-5 text-[clamp(2.5rem,12vw,4rem)]"
                      initial={{ y: "110%" }}
                      animate={{ y: "0%" }}
                      exit={{ y: "110%" }}
                      transition={{ duration: 0.7, ease: ease.expo, delay: 0.18 + i * 0.07 }}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                      <span className="label text-mute">0{i + 1}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </nav>
            <motion.div
              className="shell relative pb-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: ease.expo, delay: 0.5 }}
            >
              <p className="label mb-3 text-mute">Say hello</p>
              <a
                href={`mailto:${site.email}`}
                className="text-xl font-medium text-bone underline decoration-ember underline-offset-4"
              >
                {site.email}
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
