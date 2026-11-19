"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useSequence } from "@/hooks/useSequence";
import { cn, ease } from "@/lib/cn";

import { useDemo } from "./useDemo";

// Each step publishes the next scheduled post; the last one holds before the loop restarts.
const STEPS = [1500, 1500, 1500, 3000] as const;
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
// Which days of the week carry a scheduled post.
const SLOTS = [0, 2, 4];

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

const spring = { type: "spring", stiffness: 300, damping: 28, mass: 0.8 } as const;

/** A week of posts going out on schedule, the grid filling as each one lands. */
export function SocialDemo() {
  const { ref, playing, reduced } = useDemo();
  const running = useSequence(STEPS, playing);
  // Reduced motion: hold the end state.
  const step = reduced ? 3 : running;

  // Three posts are already up; one more is published on each step.
  const published = step;
  const visible = POSTS.slice(0, 3 + published);
  // Newest first, like a real feed.
  const feed = [...visible].reverse();

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
            <span className="tabular-nums text-bone-dim">{3 + published}</span> posts this fortnight
          </span>
        </span>
        <span className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-bone">
          Following
        </span>
      </div>

      {/* Feed grid */}
      <div className="grid grid-cols-3 gap-1.5">
        <AnimatePresence initial={false} mode="popLayout">
          {feed.map((post, i) => (
            <motion.div
              key={post.id}
              layout
              style={{ borderRadius: 10 }}
              className={cn(
                "relative grid aspect-square place-items-center overflow-hidden p-1.5",
                post.className,
              )}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={spring}
            >
              {post.content}
              {/* The heart on the newest post */}
              {i === 0 && published > 0 && (
                <motion.span
                  key={`heart-${published}`}
                  className="absolute inset-0 grid place-items-center"
                  initial={{ opacity: 0, scale: 0.3 }}
                  animate={{ opacity: [0, 1, 1, 0], scale: [0.3, 1.15, 1, 1.2], y: [0, 0, 0, -8] }}
                  transition={{ duration: 1.2, times: [0, 0.25, 0.7, 1], ease: ease.quart, delay: 0.25 }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-7 w-7 drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
                    fill="#f1eee7"
                  >
                    <path d="M12 20.5s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.9a4.3 4.3 0 0 1 7.5 2.6c0 5.6-7.5 10-7.5 10Z" />
                  </svg>
                </motion.span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {/* Keep the grid two rows tall while it fills */}
        {Array.from({ length: Math.max(0, 6 - feed.length) }, (_, i) => (
          <motion.div
            key={`empty-${i}`}
            layout
            style={{ borderRadius: 10 }}
            className="aspect-square border border-dashed border-white/10"
          />
        ))}
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
                <motion.span
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border",
                    scheduled ? "border-ember/70" : "border-white/10",
                  )}
                  initial={false}
                  animate={{ backgroundColor: done ? "rgba(255, 91, 46, 1)" : "rgba(255, 91, 46, 0)" }}
                  transition={{ duration: 0.4 }}
                >
                  {scheduled && (
                    <motion.svg
                      viewBox="0 0 10 10"
                      className="h-2.5 w-2.5"
                      fill="none"
                      initial={false}
                      animate={{ opacity: done ? 1 : 0, scale: done ? 1 : 0.4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                    >
                      <path d="m2 5.2 2 2 4-4.4" stroke="#070708" strokeWidth="1.6" />
                    </motion.svg>
                  )}
                </motion.span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
