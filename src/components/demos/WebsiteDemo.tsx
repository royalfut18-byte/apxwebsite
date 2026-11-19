"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// 0 empty frame · 1 page builds · 2 cursor clicks the button · 3 resizes to a phone · 4 hold
const STEPS = [500, 2300, 2600, 1100, 2400] as const;

const spring = { type: "spring", stiffness: 210, damping: 30, mass: 0.9 } as const;

/** A site assembling itself, taking an enquiry, then reflowing to a phone. */
export function WebsiteDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the finished page, enquiry and all.
  const step = reduced ? 2 : running;

  const built = step >= 1;
  const clicked = step === 2;
  const phone = step >= 3;

  const pop = (i: number) => ({
    initial: false as const,
    animate: built ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 10, scale: 0.96 },
    transition: { duration: 0.6, ease: ease.expo, delay: built ? i * 0.07 : 0 },
  });

  return (
    <div ref={ref} aria-hidden="true" className="relative flex h-full w-full items-center justify-center">
      <motion.div
        layout
        transition={spring}
        style={{ borderRadius: 16 }}
        className={cn(
          "relative overflow-hidden border border-white/10 bg-ink-900 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]",
          phone ? "aspect-[9/16] h-full max-h-[21rem]" : "aspect-[16/10.5] w-full max-w-[34rem]",
        )}
      >
        {/* Browser bar */}
        <motion.div
          layout
          transition={spring}
          className="flex h-8 items-center gap-1.5 border-b border-white/[0.07] px-3"
        >
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <motion.span
            layout
            transition={spring}
            className="ml-2 flex h-4 min-w-0 flex-1 items-center rounded-full bg-white/[0.06] px-2 font-mono text-[8px] tracking-wide text-mute"
          >
            <span className="truncate">yourbusiness.com.au</span>
          </motion.span>
        </motion.div>

        <div className={cn("flex h-[calc(100%-2rem)] flex-col gap-3 p-4", phone && "gap-2.5 p-3")}>
          {/* Site header */}
          <motion.div layout transition={spring} className="flex items-center justify-between">
            <motion.span {...pop(0)} className="block h-2.5 w-12 rounded-full bg-bone/80" />
            {phone ? (
              <motion.span layout="position" className="grid gap-[3px]">
                <span className="block h-px w-4 bg-bone/70" />
                <span className="block h-px w-4 bg-bone/70" />
              </motion.span>
            ) : (
              <motion.span {...pop(1)} className="flex items-center gap-2">
                <span className="block h-1.5 w-7 rounded-full bg-white/20" />
                <span className="block h-1.5 w-7 rounded-full bg-white/20" />
                <span className="block h-1.5 w-7 rounded-full bg-white/20" />
              </motion.span>
            )}
          </motion.div>

          {/* Hero: copy + picture */}
          <div
            className={cn("flex min-h-0 flex-1 gap-4", phone ? "flex-col-reverse gap-2.5" : "items-center")}
          >
            <motion.div
              layout
              transition={spring}
              className={cn("flex flex-col gap-2", phone ? "w-full" : "w-[52%]")}
            >
              <motion.span {...pop(2)} className="block h-4 w-[92%] rounded-[5px] bg-bone" />
              <motion.span {...pop(3)} className="block h-4 w-[64%] rounded-[5px] bg-bone" />
              <motion.span {...pop(4)} className="mt-1 block h-1.5 w-[84%] rounded-full bg-white/20" />
              <motion.span {...pop(5)} className="block h-1.5 w-[58%] rounded-full bg-white/20" />
              <motion.span
                {...pop(6)}
                className="relative mt-2 flex h-7 w-24 items-center justify-center rounded-full bg-ember text-[9px] font-semibold text-ink"
              >
                Book now
                <AnimatePresence>
                  {clicked && (
                    <motion.span
                      key="ring"
                      className="absolute inset-0 rounded-full border border-ember"
                      initial={{ opacity: 0.9, scale: 1 }}
                      animate={{ opacity: 0, scale: 1.7 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
                    />
                  )}
                </AnimatePresence>
              </motion.span>
            </motion.div>

            <motion.div
              layout
              transition={spring}
              style={{ borderRadius: 10 }}
              className={cn("relative overflow-hidden", phone ? "h-[38%] w-full shrink-0" : "h-full flex-1")}
            >
              <motion.div
                {...pop(3)}
                className="absolute inset-0 bg-[radial-gradient(120%_90%_at_20%_10%,#ff8a5c_0%,#ff5b2e_32%,#7a1f08_70%,#1a0905_100%)]"
              />
              <motion.span
                {...pop(5)}
                className="absolute bottom-2 left-2 block h-5 w-5 rounded-full bg-bone/90"
              />
              <motion.span
                {...pop(6)}
                className="absolute bottom-2.5 left-9 block h-1.5 w-12 rounded-full bg-bone/70"
              />
            </motion.div>
          </div>

          {/* Three feature tiles (desktop only) */}
          {!phone && (
            <motion.div layout="position" transition={spring} className="grid grid-cols-3 gap-2.5">
              {[7, 8, 9].map((i) => (
                <motion.span
                  key={i}
                  {...pop(i)}
                  className="block h-9 rounded-lg border border-white/[0.07] bg-white/[0.035]"
                />
              ))}
            </motion.div>
          )}
        </div>

        {/* The visitor's cursor */}
        <AnimatePresence>
          {clicked && (
            <motion.svg
              key="cursor"
              viewBox="0 0 16 16"
              className="absolute left-0 top-0 h-4 w-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
              initial={{ left: "88%", top: "88%", opacity: 0, scale: 1 }}
              animate={{
                left: ["88%", "19%", "19%", "19%"],
                top: ["88%", "71%", "71%", "71%"],
                opacity: [0, 1, 1, 1],
                scale: [1, 1, 0.78, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, times: [0, 0.62, 0.74, 0.86], ease: ease.inOut }}
            >
              <path d="M2 1.5 13 8l-5 1.2L5.6 14 2 1.5Z" fill="#f1eee7" stroke="#070708" strokeWidth="1" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* The enquiry lands */}
        <AnimatePresence>
          {clicked && (
            <motion.div
              key="toast"
              className="absolute right-3 top-11 flex items-center gap-2 rounded-lg border border-white/10 bg-ink-600/95 px-2.5 py-2 backdrop-blur"
              initial={{ opacity: 0, x: 18, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.55, ease: ease.expo, delay: reduced ? 0 : 1.35 }}
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-ember">
                <svg viewBox="0 0 10 10" className="h-2 w-2" fill="none">
                  <path d="m2 5.2 2 2 4-4.4" stroke="#070708" strokeWidth="1.6" />
                </svg>
              </span>
              <span className="text-[9px] font-semibold leading-none text-bone">New booking request</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
