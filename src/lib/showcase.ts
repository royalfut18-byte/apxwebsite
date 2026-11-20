import type { StaticImageData } from "next/image";

import ask1 from "@/assets/showcase/electrician-1.webp";
import ask2 from "@/assets/showcase/electrician-2.webp";
import ask3 from "@/assets/showcase/electrician-3.webp";
import lox1 from "@/assets/showcase/salon-1.webp";
import lox2 from "@/assets/showcase/salon-2.webp";
import lox3 from "@/assets/showcase/salon-3.webp";
import dolls1 from "@/assets/showcase/toys-1.webp";
import dolls2 from "@/assets/showcase/toys-2.webp";
import dolls3 from "@/assets/showcase/toys-3.webp";
import yr1 from "@/assets/showcase/yrmart-1.webp";
import yr2 from "@/assets/showcase/yrmart-2.webp";
import yr3 from "@/assets/showcase/yrmart-3.webp";

import { projects, type Project } from "./projects";

export type Screen = {
  image: StaticImageData;
  project: Project;
};

const find = (slug: string) => {
  const project = projects.find((p) => p.slug === slug);
  if (!project) throw new Error(`No project called "${slug}" in projects.ts`);
  return project;
};

const lox = find("salon");
const ask = find("electrician");
const yr = find("yr-mart");
const dolls = find("toys");

/**
 * The screens on the hero's wall of work, in the order they come round.
 * Each is a real page from a client site, with anything that names the client removed
 * (see the note in projects.ts). Neighbours are always different clients.
 */
export const screens: Screen[] = [
  { image: ask1, project: ask },
  { image: lox1, project: lox },
  { image: dolls1, project: dolls },
  { image: yr1, project: yr },
  { image: ask3, project: ask },
  { image: lox2, project: lox },
  { image: dolls3, project: dolls },
  { image: yr2, project: yr },
  { image: ask2, project: ask },
  { image: lox3, project: lox },
  { image: dolls2, project: dolls },
  { image: yr3, project: yr },
];
