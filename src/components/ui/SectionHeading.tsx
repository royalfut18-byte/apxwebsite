import { cn } from "@/lib/cn";

import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";

type SectionHeadingProps = {
  index: string;
  label: string;
  /** Supports the same *accent* and "\n" markup as RevealText. */
  title: string;
  children?: React.ReactNode;
  /** "dark" for the ink sections, "light" for the paper one. */
  tone?: "dark" | "light";
  id?: string;
  className?: string;
};

/**
 * The opening of every section: a numbered label and a short aside on one line,
 * then the headline across the full width beneath them.
 */
export function SectionHeading({
  index,
  label,
  title,
  children,
  tone = "dark",
  id,
  className,
}: SectionHeadingProps) {
  const light = tone === "light";
  return (
    <header className={className}>
      <div
        className={cn(
          "flex flex-col gap-6 border-b pb-6 md:flex-row md:items-end md:justify-between md:pb-7",
          light ? "border-ink/15" : "border-white/10",
        )}
      >
        <Reveal y={14}>
          <p className={cn("label flex items-center gap-3", light ? "text-ink/65" : "text-mute")}>
            <span className={light ? "text-ember-ink" : "text-ember"}>{index}</span>
            <span className={cn("h-px w-8", light ? "bg-ink/25" : "bg-white/20")} />
            {label}
          </p>
        </Reveal>
        {children ? (
          <Reveal delay={0.1} y={14}>
            <div
              className={cn(
                "max-w-[26rem] text-[1.0625rem] leading-relaxed md:text-right md:text-lg",
                light ? "text-ink/70" : "text-bone-dim",
              )}
            >
              {children}
            </div>
          </Reveal>
        ) : null}
      </div>
      <RevealText
        as="h2"
        id={id}
        text={title}
        className={cn(
          "display mt-8 text-[clamp(2.6rem,7.6vw,8.25rem)] md:mt-12",
          light ? "text-ink [&_.accent]:text-ember-deep" : "text-bone",
        )}
      />
    </header>
  );
}
