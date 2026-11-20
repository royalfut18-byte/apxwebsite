"use client";

import { motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// 0 empty frame · 1 page builds · 2 a visitor clicks the button · 3 the same site on a phone
const STEPS = [500, 2200, 2700, 3200] as const;

const move = { duration: 0.75, ease: ease.expo } as const;

/** One placeholder block of the mock page. Pops in once the page starts "building". */
function Block({ on, order, className }: { on: boolean; order: number; className: string }) {
  return (
    <motion.span
      className={cn("block", className)}
      initial={false}
      animate={
        on
          ? { opacity: 1, transform: "translateY(0px) scale(1)" }
          : { opacity: 0, transform: "translateY(10px) scale(0.96)" }
      }
      transition={{ duration: 0.55, ease: ease.expo, delay: on ? order * 0.065 : 0 }}
    />
  );
}

const PHOTO = "bg-[radial-gradient(120%_90%_at_20%_10%,#ff8a5c_0%,#ff5b2e_32%,#7a1f08_70%,#1a0905_100%)]";

function BrowserBar() {
  return (
    <div className="flex h-8 shrink-0 items-center gap-1.5 border-b border-white/[0.07] px-3">
      <span className="h-2 w-2 rounded-full bg-white/15" />
      <span className="h-2 w-2 rounded-full bg-white/15" />
      <span className="h-2 w-2 rounded-full bg-white/15" />
      <span className="ml-2 flex h-4 min-w-0 flex-1 items-center rounded-full bg-white/[0.06] px-2 font-mono text-[8px] tracking-wide text-mute">
        <span className="truncate">yourbusiness.com.au</span>
      </span>
    </div>
  );
}

/**
 * A site assembling itself, taking an enquiry, then shown on a phone.
 * Everything that moves is a transform or an opacity, so the browser can run the whole
 * thing on its compositor.
 */
export function WebsiteDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the finished page, enquiry and all.
  const step = reduced ? 2 : running;

  const built = step >= 1;
  const clicked = step === 2;
  const phone = step >= 3;

  return (
    <div ref={ref} aria-hidden="true" className="relative flex h-full w-full items-center justify-center">
      {/* Desktop */}
      <motion.div
        className="relative flex aspect-[16/10.5] w-full max-w-[34rem] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
        initial={false}
        animate={phone ? { opacity: 0, transform: "scale(0.82)" } : { opacity: 1, transform: "scale(1)" }}
        transition={move}
      >
        <BrowserBar />
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <Block on={built} order={0} className="h-2.5 w-12 rounded-full bg-bone/80" />
            <span className="flex items-center gap-2">
              <Block on={built} order={1} className="h-1.5 w-7 rounded-full bg-white/20" />
              <Block on={built} order={1} className="h-1.5 w-7 rounded-full bg-white/20" />
              <Block on={built} order={1} className="h-1.5 w-7 rounded-full bg-white/20" />
            </span>
          </div>

          <div className="flex min-h-0 flex-1 items-center gap-4">
            <div className="flex w-[52%] flex-col gap-2">
              <Block on={built} order={2} className="h-4 w-[92%] rounded-[5px] bg-bone" />
              <Block on={built} order={3} className="h-4 w-[64%] rounded-[5px] bg-bone" />
              <Block on={built} order={4} className="mt-1 h-1.5 w-[84%] rounded-full bg-white/20" />
              <Block on={built} order={5} className="h-1.5 w-[58%] rounded-full bg-white/20" />
              <motion.span
                className="relative mt-2 flex h-7 w-24 items-center justify-center rounded-full bg-ember text-[9px] font-semibold text-ink"
                initial={false}
                animate={
                  built
                    ? { opacity: 1, transform: "translateY(0px) scale(1)" }
                    : { opacity: 0, transform: "translateY(10px) scale(0.96)" }
                }
                transition={{ duration: 0.55, ease: ease.expo, delay: built ? 0.39 : 0 }}
              >
                Book now
                {/* The click */}
                <motion.span
                  className="absolute inset-0 rounded-full border border-ember"
                  initial={false}
                  animate={
                    clicked
                      ? { opacity: [0, 0.9, 0], transform: ["scale(1)", "scale(1)", "scale(1.7)"] }
                      : { opacity: 0, transform: "scale(1)" }
                  }
                  transition={
                    clicked
                      ? { duration: 0.9, times: [0, 0.05, 1], ease: "easeOut", delay: 1 }
                      : { duration: 0 }
                  }
                />
              </motion.span>
            </div>

            <motion.div
              className={cn("relative h-full flex-1 overflow-hidden rounded-[10px]", PHOTO)}
              initial={false}
              animate={
                built
                  ? { opacity: 1, transform: "translateY(0px) scale(1)" }
                  : { opacity: 0, transform: "translateY(10px) scale(0.96)" }
              }
              transition={{ duration: 0.55, ease: ease.expo, delay: built ? 0.2 : 0 }}
            >
              <span className="absolute bottom-2 left-2 block h-5 w-5 rounded-full bg-bone/90" />
              <span className="absolute bottom-2.5 left-9 block h-1.5 w-12 rounded-full bg-bone/70" />
            </motion.div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[7, 8, 9].map((order) => (
              <Block
                key={order}
                on={built}
                order={order}
                className="h-9 rounded-lg border border-white/[0.07] bg-white/[0.035]"
              />
            ))}
          </div>
        </div>

        {/* The visitor's cursor: glides to the button, presses, stays. */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          initial={false}
          animate={
            clicked
              ? {
                  opacity: [0, 1, 1],
                  transform: ["translate(88%, 88%)", "translate(19%, 72%)", "translate(19%, 72%)"],
                }
              : { opacity: 0, transform: "translate(88%, 88%)" }
          }
          transition={clicked ? { duration: 1.5, times: [0, 0.62, 1], ease: ease.inOut } : { duration: 0.2 }}
        >
          <svg viewBox="0 0 16 16" className="h-4 w-4">
            <path d="M2 1.5 13 8l-5 1.2L5.6 14 2 1.5Z" fill="#f1eee7" stroke="#070708" strokeWidth="1" />
          </svg>
        </motion.div>

        {/* The enquiry lands */}
        <motion.div
          className="absolute right-3 top-11 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-600 px-2.5 py-2"
          initial={false}
          animate={
            clicked
              ? { opacity: 1, transform: "translateX(0px) scale(1)" }
              : { opacity: 0, transform: "translateX(18px) scale(0.95)" }
          }
          transition={{ duration: 0.55, ease: ease.expo, delay: clicked && !reduced ? 1.35 : 0 }}
        >
          <span className="grid h-4 w-4 place-items-center rounded-full bg-ember">
            <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none">
              <path d="m2 5.2 2 2 4-4.4" stroke="#070708" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="text-[9px] font-semibold leading-none text-bone">New booking request</span>
        </motion.div>
      </motion.div>

      {/* The same site on a phone */}
      <motion.div
        className="absolute flex aspect-[9/16] h-full max-h-[21rem] flex-col overflow-hidden rounded-[1.4rem] border border-white/10 bg-ink-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
        initial={false}
        animate={phone ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(1.14)" }}
        transition={{ ...move, delay: phone ? 0.12 : 0 }}
      >
        <div className="flex h-6 shrink-0 items-center justify-center">
          <span className="h-1 w-10 rounded-full bg-white/15" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 px-3 pb-3">
          <div className="flex items-center justify-between">
            <span className="block h-2.5 w-12 rounded-full bg-bone/80" />
            <span className="grid gap-[3px]">
              <span className="block h-px w-4 bg-bone/70" />
              <span className="block h-px w-4 bg-bone/70" />
            </span>
          </div>
          <div className={cn("relative h-[38%] shrink-0 overflow-hidden rounded-[10px]", PHOTO)}>
            <span className="absolute bottom-2 left-2 block h-5 w-5 rounded-full bg-bone/90" />
            <span className="absolute bottom-2.5 left-9 block h-1.5 w-12 rounded-full bg-bone/70" />
          </div>
          <span className="block h-4 w-[92%] rounded-[5px] bg-bone" />
          <span className="block h-4 w-[64%] rounded-[5px] bg-bone" />
          <span className="mt-1 block h-1.5 w-[84%] rounded-full bg-white/20" />
          <span className="block h-1.5 w-[58%] rounded-full bg-white/20" />
          <span className="mt-auto flex h-8 w-full items-center justify-center rounded-full bg-ember text-[10px] font-semibold text-ink">
            Book now
          </span>
        </div>
      </motion.div>
    </div>
  );
}
