"use client";

import { motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// Each step publishes the next scheduled post; the last one holds before the loop restarts.
const STEPS = [1500, 1500, 1500, 3000] as const;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
// Which days of the week carry a scheduled post.
const SLOTS = [0, 2, 4];
/** Posts already on the grid before the week starts. */
const STARTING = 3;

// Six small "designed" posts. Type and colour only, so nothing has to load.
const POSTS: { id: string; className: string; content: React.ReactNode }[] = [
  {
    id: "new",
    className: "bg-ember text-ink",
    content: <span className="display text-[1.35rem] leading-none">New in</span>,
  },
  {
    id: "quote",
    className: "bg-bone text-ink",
    content: (
      <span className="font-serif text-[1.05rem] italic leading-[1.05]">
        Hello,
        <br />
        weekend.
      </span>
    ),
  },
  {
    id: "photo",
    className: "bg-[radial-gradient(90%_90%_at_30%_25%,#ffb49b_0%,#ff5b2e_45%,#5c1705_100%)]",
    content: <span className="block h-7 w-7 rounded-full border-2 border-bone/90" />,
  },
  {
    id: "offer",
    className: "bg-ink-600 text-bone",
    content: (
      <span className="text-center">
        <span className="display block text-[1.5rem] leading-none text-ember">20%</span>
        <span className="label mt-1 block text-[7px] text-bone-dim">This week</span>
      </span>
    ),
  },
  {
    id: "split",
    className: "bg-[linear-gradient(135deg,#f1eee7_0%,#f1eee7_50%,#ff5b2e_50%,#ff5b2e_100%)] text-ink",
    content: <span className="label text-[8px]">Before / After</span>,
  },
  {
    id: "open",
    className: "bg-[repeating-linear-gradient(45deg,#1e1e22_0_9px,#2a2a2f_9px_18px)] text-bone",
    content: <span className="display text-[1.2rem] leading-none">Open late</span>,
  },
];

/** Where a grid slot sits, as a transform. Slot 0 is top left; each tile is a third wide. */
const place = (slot: number) => `translate(${(slot % 3) * 100}%, ${Math.floor(slot / 3) * 100}%)`;
const TILE = "absolute left-0 top-0 aspect-square w-1/3 p-[3px]";

/**
 * A week of posts going out on schedule, the grid filling as each one lands.
 * The tiles are stacked in one corner and slid to their slot, so reshuffling the feed
 * is a transform: nothing is measured or laid out again.
 */
export function SocialDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the end state.
  const published = reduced ? 3 : running;
  const newest = STARTING + published - 1;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="mx-auto flex h-full w-full max-w-[20rem] flex-col justify-center gap-4"
    >
      {/* Profile */}
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[conic-gradient(from_180deg,#ff5b2e,#ffb49b,#ff5b2e)] p-[2px]">
          <span className="grid h-full w-full place-items-center rounded-full bg-ink-900 text-[11px] font-bold text-bone">
            YB
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-bone">yourbusiness</span>
          <span className="block truncate font-mono text-[10px] text-mute">
            <span className="tabular-nums text-bone-dim">{STARTING + published}</span> posts this fortnight
          </span>
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-bone">
          Following
        </span>
      </div>

      {/* Feed grid: three across, two down. */}
      <div className="relative -m-[3px] aspect-[3/2]">
        {POSTS.map((post, slot) => (
          <div key={post.id} className={TILE} style={{ transform: place(slot) }}>
            <div className="h-full w-full rounded-[10px] border border-dashed border-white/10" />
          </div>
        ))}

        {POSTS.map((post, i) => {
          const shown = i <= newest;
          // Newest first, like a real feed. A post waiting its turn sits where it will land.
          const slot = shown ? newest - i : 0;
          return (
            <motion.div
              key={post.id}
              className={TILE}
              initial={false}
              animate={{ transform: place(slot) }}
              // A post leaving the grid fades where it is, then resets out of sight.
              transition={shown ? { duration: 0.7, ease: ease.expo } : { duration: 0, delay: 0.3 }}
            >
              <motion.div
                className={cn(
                  "relative grid h-full w-full place-items-center overflow-hidden rounded-[10px] p-1.5",
                  post.className,
                )}
                initial={false}
                animate={
                  shown ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.5)" }
                }
                transition={
                  shown ? { duration: 0.6, ease: ease.back, delay: 0.1 } : { duration: 0.25, ease: "easeOut" }
                }
              >
                {post.content}
                {/* The heart on the newest post */}
                {i === newest && published > 0 && !reduced && (
                  <motion.span
                    className="absolute inset-0 grid place-items-center"
                    initial={{ opacity: 0, transform: "translateY(0px) scale(0.3)" }}
                    animate={{
                      opacity: [0, 1, 1, 0],
                      transform: [
                        "translateY(0px) scale(0.3)",
                        "translateY(0px) scale(1.15)",
                        "translateY(0px) scale(1)",
                        "translateY(-8px) scale(1.2)",
                      ],
                    }}
                    transition={{ duration: 1.2, times: [0, 0.25, 0.7, 1], ease: ease.quart, delay: 0.45 }}
                  >
                    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="#f1eee7">
                      <path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10-7.5 10Z" />
                    </svg>
                  </motion.span>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* The week's schedule */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="label text-faint">This week</span>
          <span className="font-mono text-[10px] text-mute">
            <span className="tabular-nums text-bone-dim">{published}</span>/{SLOTS.length} posted
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {DAYS.map((day, i) => {
            const slot = SLOTS.indexOf(i);
            const scheduled = slot !== -1;
            const done = scheduled && slot < published;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-[9px] text-faint">{day}</span>
                <span
                  className={cn(
                    "relative grid h-6 w-6 place-items-center rounded-full border",
                    scheduled ? "border-ember/70" : "border-white/10",
                  )}
                >
                  {scheduled && (
                    <motion.span
                      className="absolute inset-0 grid place-items-center rounded-full bg-ember"
                      initial={false}
                      animate={
                        done ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.4)" }
                      }
                      transition={{ duration: 0.45, ease: done ? ease.back : "easeOut" }}
                    >
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none">
                        <path d="m2 5.2 2 2 4-4.4" stroke="#070708" strokeWidth="1.6" />
                      </svg>
                    </motion.span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
