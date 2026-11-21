/**
 * Single source of truth for business details and page copy.
 * Change things here and every section, the metadata and the structured data follow.
 */

type SiteConfig = {
  name: string;
  legalName: string;
  url: string;
  email: string;
  phone: string;
  instagram: string;
  location: string;
  timeZone: string;
  tagline: string;
  description: string;
  shortDescription: string;
};

export const site: SiteConfig = {
  name: "APXS",
  legalName: "APXS",
  url: "https://apxs.com.au",
  /** Where enquiries go. Used by the contact form and every "email us" link. */
  email: "hello@apxs.com.au",
  /** Optional. Leave blank to hide. Use full international format, e.g. "+61 400 000 000". */
  phone: "",
  /** Optional. Just the handle, without the @. Leave blank to hide. */
  instagram: "",
  /** Shown in the hero, footer and structured data. */
  location: "Australia",
  /** IANA zone for the live clock in the hero and footer. */
  timeZone: "Australia/Sydney",
  tagline: "We take local businesses to the top.",
  description:
    "APXS builds fast, good-looking websites for Australian businesses, then gets them found on Google, runs the Instagram and builds custom tools like SMS senders. One team, pulling in one direction.",
  shortDescription: "Websites, SEO, Instagram and custom tools for Australian businesses.",
};

export const nav = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
] as const;

export type ServiceKey = "websites" | "seo" | "social" | "tools";

export const services: {
  key: ServiceKey;
  index: string;
  title: string;
  kicker: string;
  body: string;
  points: string[];
}[] = [
  {
    key: "websites",
    index: "01",
    title: "Websites",
    kicker: "Designed to be chosen.",
    body: "A site built around your business, not squeezed into a template. Fast, sharp on every phone, and set up so a visitor's next step is to call, book or buy.",
    points: ["Custom design", "Mobile-first build", "Bookings, quotes & shops"],
  },
  {
    key: "seo",
    index: "02",
    title: "SEO",
    kicker: "Built to be found.",
    body: "People are already searching for what you do. We sort the technical side, your local presence and the words on the page, so it's you they find.",
    points: ["Local search", "Technical SEO", "Content that ranks"],
  },
  {
    key: "social",
    index: "03",
    title: "Instagram",
    kicker: "Posted, not postponed.",
    body: "We run your Instagram so it actually gets done. Planned ahead, designed to match your brand, captioned in your voice and posted on schedule.",
    points: ["Content planning", "Design & captions", "Scheduling & posting"],
  },
  {
    key: "tools",
    index: "04",
    title: "Custom tools",
    kicker: "Software that fits.",
    body: "When off-the-shelf doesn't fit, we build what does. Like bulk SMS senders that reach your whole customer list in one click.",
    points: ["Bulk SMS senders", "Built around your workflow", "Simple to use"],
  },
];

export const processSteps = [
  {
    index: "01",
    title: "Discover",
    body: "We start with your business: what you sell, who buys it, and who you're up against on Google.",
  },
  {
    index: "02",
    title: "Design",
    body: "You see the look, the layout and the words before we build, so there are no surprises.",
  },
  {
    index: "03",
    title: "Build",
    body: "Fast, mobile-first and set up for search from day one.",
  },
  {
    index: "04",
    title: "Grow",
    body: "Launch is the start, not the finish. SEO, Instagram and tools keep the enquiries coming.",
  },
] as const;
