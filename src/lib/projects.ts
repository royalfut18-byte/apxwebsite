import type { StaticImageData } from "next/image";

import electricianDesktop from "@/assets/work/electrician-desktop.webp";
import salonDesktop from "@/assets/work/salon-desktop.webp";
import toysDesktop from "@/assets/work/toys-desktop.webp";
import yrDesktop from "@/assets/work/yrmart-desktop.webp";
import yrMobile from "@/assets/work/yrmart-mobile.webp";

/**
 * Client confidentiality: only YR Mart is shown by name, with its address and a link.
 * The other projects are described by what the business does. Their screenshots have the
 * business name, logo and phone numbers blurred out, and nothing here (names, links,
 * file names) says whose they are. Keep it that way when adding work.
 */
export type Project = {
  slug: string;
  name: string;
  /** What the business is, in a few words. */
  sector: string;
  /** Optional. Left out where the business isn't tied to one place. */
  place?: string;
  /** One or two sentences on what was built. */
  summary: string;
  /** Things you can see on the live site. */
  built: string[];
  /** The live site. Left out for clients who are not named. */
  url?: string;
  /** Shown in the mock browser bar. */
  displayUrl: string;
  desktop: StaticImageData;
  /** Optional phone capture. */
  mobile?: StaticImageData;
  /** Flat colours shown in the two screens until their captures have loaded. */
  tint: { desktop: string; mobile: string };
  /** Card palette, taken from the client's own brand. */
  theme: {
    bg: string;
    fg: string;
    /** Secondary text on the card. */
    sub: string;
    /** Tags, rules and the index number. */
    accent: string;
    /** Hairlines and tag borders. */
    line: string;
  };
};

export const projects: Project[] = [
  {
    slug: "salon",
    name: "Hair salon",
    sector: "Hair extensions & salon",
    place: "Sydney",
    summary:
      "A luxury salon site built around the booking. Services, offers, real transformations and reviews, plus an online shop for wigs and toppers.",
    built: ["Booking-led design", "Online shop", "Gallery & reviews"],
    displayUrl: "hair salon · client site",
    desktop: salonDesktop,
    tint: { desktop: "#ccc4bc", mobile: "#b7aea6" },
    theme: {
      bg: "#f1e8dc",
      fg: "#1c1210",
      sub: "#5f4f45",
      accent: "#77561f",
      line: "rgba(28, 18, 16, 0.16)",
    },
  },
  {
    slug: "electrician",
    name: "Electrician",
    sector: "24/7 electricians",
    place: "Sydney",
    summary:
      "A call-first site for an emergency electrician. Fourteen service pages, a no-nonsense emergency flow, real job photos and reviews straight from Google.",
    built: ["Emergency call flow", "14 service pages", "Project gallery"],
    displayUrl: "electrician · client site",
    desktop: electricianDesktop,
    tint: { desktop: "#585346", mobile: "#665a48" },
    theme: { bg: "#f9a132", fg: "#0f0c07", sub: "#4a3410", accent: "#0f0c07", line: "rgba(15, 12, 7, 0.22)" },
  },
  {
    slug: "yr-mart",
    name: "YR Mart",
    sector: "Mobile phone repairs",
    place: "Neutral Bay, Sydney",
    summary:
      "A walk-in repair shop on Military Road. Live open-or-closed status, ten services with turnaround times, and straight answers before you walk in.",
    built: ["Live opening status", "10 repair services", "Reviews & FAQ"],
    url: "https://www.yrmartmobilerepairs.com.au/",
    displayUrl: "yrmartmobilerepairs.com.au",
    desktop: yrDesktop,
    mobile: yrMobile,
    tint: { desktop: "#d9d6d4", mobile: "#dcdad8" },
    theme: {
      bg: "#2b60e2",
      fg: "#ffffff",
      sub: "#e9efff",
      accent: "#ffffff",
      line: "rgba(255, 255, 255, 0.26)",
    },
  },
  {
    slug: "toys",
    name: "Toy brand",
    sector: "Plush companions for kids",
    summary:
      "A colourful brand site for dolls with a purpose. Six characters, each with its own little world, and a give-back story running through it.",
    built: ["Brand storytelling", "Six character worlds", "Giving-back story"],
    displayUrl: "toy brand · client site",
    desktop: toysDesktop,
    tint: { desktop: "#dad3cd", mobile: "#ece5e0" },
    theme: {
      bg: "#ffd9e4",
      fg: "#201a25",
      sub: "#5d4a5e",
      accent: "#a81c4d",
      line: "rgba(32, 26, 37, 0.16)",
    },
  },
];
