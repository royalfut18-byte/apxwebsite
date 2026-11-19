import type { StaticImageData } from "next/image";

import askDesktop from "@/assets/work/askelectrical-desktop.webp";
import askMobile from "@/assets/work/askelectrical-mobile.webp";
import loxDesktop from "@/assets/work/lusciouslox-desktop.webp";
import loxMobile from "@/assets/work/lusciouslox-mobile.webp";
import dollsDesktop from "@/assets/work/powerdolls-desktop.webp";
import dollsMobile from "@/assets/work/powerdolls-mobile.webp";
import yrDesktop from "@/assets/work/yrmart-desktop.webp";
import yrMobile from "@/assets/work/yrmart-mobile.webp";

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
  url: string;
  /** Shown in the mock browser bar. */
  displayUrl: string;
  desktop: StaticImageData;
  mobile: StaticImageData;
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
    slug: "lusciouslox",
    name: "Lusciouslox",
    sector: "Hair extensions & salon",
    place: "Neutral Bay, Sydney",
    summary:
      "A luxury salon site built around the booking. Services, offers, real transformations and reviews, plus an online shop for wigs and toppers.",
    built: ["Booking-led design", "Online shop", "Gallery & reviews"],
    url: "https://www.lusciouslox.com.au/",
    displayUrl: "lusciouslox.com.au",
    desktop: loxDesktop,
    mobile: loxMobile,
    theme: {
      bg: "#f1e8dc",
      fg: "#1c1210",
      sub: "#5f4f45",
      accent: "#77561f",
      line: "rgba(28, 18, 16, 0.16)",
    },
  },
  {
    slug: "ask-electrical",
    name: "ASK Electrical",
    sector: "24/7 electricians",
    place: "Sydney",
    summary:
      "A call-first site for an emergency electrician. Fourteen service pages, a no-nonsense emergency flow, real job photos and reviews straight from Google.",
    built: ["Emergency call flow", "14 service pages", "Project gallery"],
    url: "https://askelectrical-website.vercel.app/",
    displayUrl: "askelectrical-website.vercel.app",
    desktop: askDesktop,
    mobile: askMobile,
    theme: {
      bg: "#f9a132",
      fg: "#0f0c07",
      sub: "#4a3410",
      accent: "#0f0c07",
      line: "rgba(15, 12, 7, 0.22)",
    },
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
    theme: {
      bg: "#2b60e2",
      fg: "#ffffff",
      sub: "#e9efff",
      accent: "#ffffff",
      line: "rgba(255, 255, 255, 0.26)",
    },
  },
  {
    slug: "power-dolls",
    name: "Power Dolls",
    sector: "Plush companions for kids",
    summary:
      "A colourful brand site for dolls with a purpose. Six characters, each with its own little world, and a give-back story running through it.",
    built: ["Brand storytelling", "Six character worlds", "Giving-back story"],
    url: "https://powerdollswebsite.vercel.app/",
    displayUrl: "powerdollswebsite.vercel.app",
    desktop: dollsDesktop,
    mobile: dollsMobile,
    theme: {
      bg: "#ffd9e4",
      fg: "#201a25",
      sub: "#5d4a5e",
      accent: "#a81c4d",
      line: "rgba(32, 26, 37, 0.16)",
    },
  },
];
