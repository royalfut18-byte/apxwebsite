"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { WEEKDAYS, addMonths, dayLabel, monthGrid, monthName } from "@/lib/booking";
import { cn, ease } from "@/lib/cn";

import { ChevronIcon } from "./icons";

type MonthCalendarProps = {
  /** The month on show, "2026-12". */
  month: string;
  /** The first and last months that have free days: the arrows stop there. */
  first: string;
  last: string;
  /** Each day with free times, and how many. */
  free: Map<string, number>;
  selected: string | null;
  today: string;
  onMonth: (month: string) => void;
  onPick: (day: string) => void;
};

// Each new month slides in from the side it was asked for.
const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36 }),
};

/**
 * A month at a time, Monday first. Days with free times stand out and can be picked; the
 * rest are faded. The chosen day's colour glides from one day to the next. Arrow keys move
 * between the days that can be picked, on into the next month or back to the last one, and
 * Page Up / Page Down change the month.
 */
export function MonthCalendar({
  month,
  first,
  last,
  free,
  selected,
  today,
  onMonth,
  onPick,
}: MonthCalendarProps) {
  const [dir, setDir] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  /** After moving to another month by keyboard: which of its days to put the focus on. */
  const focusAfter = useRef<"first" | "last" | null>(null);
  const grid = monthGrid(month);
  const { name, year } = monthName(month);
  const pickable = grid.filter((d): d is string => d !== null && free.has(d));

  const go = (n: number) => {
    setDir(n);
    onMonth(addMonths(month, n));
  };

  useEffect(() => {
    const which = focusAfter.current;
    if (!which) return;
    focusAfter.current = null;
    // Only the new month's days: the old month is still sliding away.
    const days = root.current?.querySelectorAll<HTMLElement>(`[data-month="${month}"] [data-free]`);
    (which === "first" ? days?.[0] : days?.[days.length - 1])?.focus();
  }, [month]);

  /** Moves to the next or previous month by keyboard, if there is one with free days. */
  const turn = (n: number) => {
    if (n > 0 ? month >= last : month <= first) return false;
    focusAfter.current = n > 0 ? "first" : "last";
    go(n);
    return true;
  };

  function onKey(event: React.KeyboardEvent<HTMLDivElement>) {
    const current = (document.activeElement as HTMLElement | null)?.dataset.day;
    if (!current) return;
    const at = grid.indexOf(current);
    const i = pickable.indexOf(current);
    let next: string | undefined;
    if (event.key === "ArrowRight") next = pickable[i + 1] ?? (turn(1) ? undefined : current);
    else if (event.key === "ArrowLeft") next = pickable[i - 1] ?? (turn(-1) ? undefined : current);
    else if (event.key === "ArrowDown")
      next = pickable.find((d) => grid.indexOf(d) >= at + 7) ?? (turn(1) ? undefined : pickable.at(-1));
    else if (event.key === "ArrowUp")
      next = pickable.findLast((d) => grid.indexOf(d) <= at - 7) ?? (turn(-1) ? undefined : pickable[0]);
    else if (event.key === "Home") next = pickable[0];
    else if (event.key === "End") next = pickable.at(-1);
    else if (event.key === "PageDown") turn(1);
    else if (event.key === "PageUp") turn(-1);
    else return;
    event.preventDefault();
    if (next) event.currentTarget.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus();
  }

  return (
    <div ref={root} data-testid="calendar">
      <div className="flex items-center justify-between gap-4">
        <h3 className="display text-[1.65rem] text-bone" aria-live="polite" data-testid="month">
          {name} <span className="text-faint">{year}</span>
        </h3>
        <div className="flex gap-2">
          {(
            [
              [-1, "Previous month", "left", month <= first],
              [1, "Next month", "right", month >= last],
            ] as const
          ).map(([n, label, side, off]) => (
            <button
              key={label}
              type="button"
              aria-label={label}
              disabled={off}
              onClick={() => go(n)}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/12 text-bone transition-[border-color,background-color,opacity,transform] duration-300 hover:border-white/35 hover:bg-white/[0.06] active:scale-95 disabled:pointer-events-none disabled:opacity-25"
            >
              <ChevronIcon dir={side} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 grid grid-cols-7 gap-1.5 text-center" aria-hidden="true">
        {WEEKDAYS.map((d) => (
          <span key={d} className="label text-faint">
            {d}
          </span>
        ))}
      </div>

      <div className="relative mt-3">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={month}
            data-month={month}
            role="group"
            aria-label={`${name} ${year}`}
            onKeyDown={onKey}
            className="grid grid-cols-7 gap-1.5"
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: ease.expo }}
          >
            {grid.map((day, i) => {
              if (!day) return <span key={`blank-${i}`} aria-hidden="true" />;
              const count = free.get(day) ?? 0;
              const on = day === selected;
              const isToday = day === today;
              return (
                <button
                  key={day}
                  type="button"
                  data-day={day}
                  data-free={count > 0 ? "" : undefined}
                  disabled={!count}
                  aria-pressed={count ? on : undefined}
                  aria-label={`${dayLabel(day)}${isToday ? ", today" : ""}: ${
                    count ? `${count} free ${count === 1 ? "time" : "times"}` : "no free times"
                  }`}
                  onClick={() => onPick(day)}
                  className={cn(
                    "relative grid aspect-square min-h-10 place-items-center rounded-2xl text-[1rem] font-medium tabular-nums transition-[background-color,color,transform] duration-300 sm:text-[1.0625rem]",
                    count
                      ? "bg-white/[0.055] text-bone hover:bg-white/[0.11] active:scale-95"
                      : "cursor-default text-faint/45",
                    on && "text-ink",
                    isToday && !on && "ring-1 ring-inset ring-white/25",
                  )}
                >
                  {on ? (
                    <motion.span
                      layoutId="calendar-day"
                      aria-hidden="true"
                      className="absolute inset-0 rounded-2xl bg-ember shadow-[0_14px_34px_-12px_rgba(255,91,46,0.85)]"
                      transition={{ type: "spring", stiffness: 520, damping: 40 }}
                    />
                  ) : null}
                  <span className="relative">{Number(day.slice(8))}</span>
                  {count ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute bottom-[16%] h-1 w-1 rounded-full transition-colors duration-300",
                        on ? "bg-ink/55" : "bg-ember",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
