import { cn } from "@/lib/cn";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
  external?: boolean;
  /** Label shown inside the cursor while hovering (desktop). */
  cursor?: string;
};

const ARROW = (
  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
    <path d="M2 12 12 2M4.5 2H12v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
  </svg>
);

/**
 * The site's pill button. On hover the fill sweeps up from the bottom and the
 * arrow is replaced by a second one sliding in from below-left.
 */
export function Button({ href, children, variant = "solid", className, external, cursor }: ButtonProps) {
  return (
    <a
      href={href}
      data-cursor={cursor ? "label" : "hover"}
      data-cursor-label={cursor}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      className={cn(
        "group relative inline-flex h-14 shrink-0 items-center gap-4 overflow-hidden whitespace-nowrap rounded-full pl-7 pr-2 text-base font-semibold",
        variant === "solid" ? "bg-bone text-ink" : "border border-white/20 text-bone",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-0 origin-bottom scale-y-0 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:scale-y-100 group-focus-visible:scale-y-100",
          variant === "solid" ? "bg-ember" : "bg-bone",
        )}
      />
      <span
        className={cn(
          "relative transition-colors duration-500",
          variant === "ghost" && "group-hover:text-ink group-focus-visible:text-ink",
        )}
      >
        {children}
      </span>
      <span
        className={cn(
          "relative grid h-10 w-10 place-items-center overflow-hidden rounded-full transition-colors duration-500",
          variant === "solid"
            ? "bg-ink text-bone"
            : "bg-white/10 text-bone group-hover:bg-ink group-focus-visible:bg-ink",
        )}
      >
        <span className="transition-transform duration-500 ease-[var(--ease-expo)] group-hover:-translate-y-6 group-hover:translate-x-6">
          {ARROW}
        </span>
        <span className="absolute -translate-x-6 translate-y-6 transition-transform duration-500 ease-[var(--ease-expo)] group-hover:translate-x-0 group-hover:translate-y-0">
          {ARROW}
        </span>
      </span>
    </a>
  );
}
