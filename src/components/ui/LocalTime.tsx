"use client";

import { useEffect, useState } from "react";

import { site } from "@/lib/site";

function format(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: site.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { time: `${pick("hour")}:${pick("minute")}`, zone: pick("timeZoneName") };
}

/**
 * The studio's local time, live. Rendered after mount only, so the server and the
 * visitor's browser never disagree about what time it is.
 */
export function LocalTime({ className }: { className?: string }) {
  const [now, setNow] = useState<{ time: string; zone: string } | null>(null);

  useEffect(() => {
    const tick = () => setNow(format(new Date()));
    tick();
    const id = window.setInterval(tick, 15_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={className}>
      <span className="tabular-nums">{now ? now.time : "--:--"}</span>
      {now?.zone ? <span className="ml-1.5">{now.zone}</span> : null}
    </span>
  );
}
