/** Small line icons for the booking panel. 16px, drawn in the current text colour. */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ClockIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M8 4.75V8l2.25 1.5" />
  </svg>
);

export const PhoneIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M5.6 1.9 3.4 2.4c-.6.1-1 .7-.9 1.3.7 5 4.7 9 9.7 9.7.6.1 1.2-.3 1.3-.9l.5-2.2c.1-.5-.2-1-.6-1.2l-2-.9c-.4-.2-.9-.1-1.2.3l-.7.9C7.9 8.8 7.2 8.1 6.6 6.5l.9-.7c.4-.3.5-.8.3-1.2l-.9-2c-.2-.5-.7-.8-1.3-.7Z" />
  </svg>
);

export const SparkIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M8 1.75v3M8 11.25v3M1.75 8h3M11.25 8h3M3.6 3.6l2 2M10.4 10.4l2 2M12.4 3.6l-2 2M5.6 10.4l-2 2" />
  </svg>
);

export const GlobeIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="8" cy="8" r="6.25" />
    <path d="M1.75 8h12.5M8 1.75c1.7 1.8 2.5 3.9 2.5 6.25S9.7 12.45 8 14.25C6.3 12.45 5.5 10.35 5.5 8S6.3 3.55 8 1.75Z" />
  </svg>
);

export const CalendarIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="2" y="3" width="12" height="11" rx="2.25" />
    <path d="M2 6.5h12M5.25 1.75v2.5M10.75 1.75v2.5" />
  </svg>
);

export const ChevronIcon = ({
  className = "h-4 w-4",
  dir,
}: IconProps & { dir: "left" | "right" | "down" }) => (
  <svg {...base} className={className}>
    <path
      d={
        dir === "left"
          ? "M10 3.5 5.5 8l4.5 4.5"
          : dir === "right"
            ? "M6 3.5 10.5 8 6 12.5"
            : "M3.5 6 8 10.5 12.5 6"
      }
    />
  </svg>
);

export const ArrowIcon = ({ className = "h-4 w-4", dir }: IconProps & { dir: "left" | "right" }) => (
  <svg {...base} className={className}>
    <path d={dir === "left" ? "M13 8H3M7 4 3 8l4 4" : "M3 8h10M9 4l4 4-4 4"} />
  </svg>
);
