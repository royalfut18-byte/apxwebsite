"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { projects, type Project } from "@/lib/projects";

import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const ARROW = (
  <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
    <path d="M2 12 12 2M4.5 2H12v7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
  </svg>
);

/**
 * A browser window and a phone showing the real, live site. The captures are long,
 * so as the card moves through the screen they scroll, like someone browsing it.
 * The pair tilts gently toward the pointer.
 */
function Devices({
  project,
  travel,
  still,
}: {
  project: Project;
  travel: MotionValue<number>;
  /** Reduced motion: no scrolling captures, no tilt. */
  still: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 140, damping: 18, mass: 0.6 });
  const rotateY = useSpring(tiltY, { stiffness: 140, damping: 18, mass: 0.6 });

  const desktopY = useTransform(travel, [0, 1], ["0%", "-52%"]);
  const mobileY = useTransform(travel, [0, 1], ["0%", "-34%"]);

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (still || e.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    tiltY.set(px * 7);
    tiltX.set(-py * 6);
  }
  function onLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  return (
    <div ref={ref} className="relative [perspective:1400px]" onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="relative [transform-style:preserve-3d]" style={{ rotateX, rotateY }}>
        {/* Browser */}
        <div className="overflow-hidden rounded-xl bg-[#131315] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.55),0_0_0_1px_rgba(0,0,0,0.12)] md:rounded-2xl">
          <div className="flex h-8 items-center gap-1.5 px-3 md:h-10 md:px-4">
            <span className="h-2 w-2 rounded-full bg-white/20 md:h-2.5 md:w-2.5" />
            <span className="h-2 w-2 rounded-full bg-white/20 md:h-2.5 md:w-2.5" />
            <span className="h-2 w-2 rounded-full bg-white/20 md:h-2.5 md:w-2.5" />
            <span className="ml-2 flex h-5 min-w-0 flex-1 items-center justify-center rounded-full bg-white/[0.07] px-3 font-mono text-[9px] tracking-wide text-white/55 md:ml-3 md:h-6 md:text-[10.5px]">
              <span className="truncate">{project.displayUrl}</span>
            </span>
            <span className="hidden w-12 md:block" />
          </div>
          <div className="relative aspect-[16/10.4] overflow-hidden bg-white">
            <motion.div className="will-change-transform" style={still ? undefined : { y: desktopY }}>
              <Image
                src={project.desktop}
                alt={`The ${project.name} website on a desktop screen`}
                placeholder="blur"
                quality={90}
                sizes="(min-width: 1024px) 56vw, 92vw"
                className="block h-auto w-full"
              />
            </motion.div>
          </div>
        </div>

        {/* Phone */}
        <div
          className="absolute -bottom-[7%] -left-[4%] w-[23%] overflow-hidden rounded-[1.1rem] bg-[#0c0c0d] p-[3px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.08)] md:-left-[7%] md:rounded-[1.75rem] md:p-[5px]"
          style={{ transform: "translateZ(50px)" }}
        >
          <div className="relative aspect-[9/18.6] overflow-hidden rounded-[0.9rem] bg-white md:rounded-[1.4rem]">
            <motion.div className="will-change-transform" style={still ? undefined : { y: mobileY }}>
              <Image
                src={project.mobile}
                alt={`The ${project.name} website on a phone`}
                placeholder="blur"
                quality={90}
                sizes="(min-width: 1024px) 14vw, 24vw"
                className="block h-auto w-full"
              />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  total,
  progress,
  stacked,
  still,
}: {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
  stacked: boolean;
  still: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Stacked (desktop): each card pins, then shrinks and dims a little as the next one covers it.
  const start = index / total;
  const end = Math.min(1, start + 1 / total);
  const scale = useTransform(progress, [start + 0.45 / total, 1], [1, 1 - (total - 1 - index) * 0.04]);
  const shade = useTransform(progress, [start + 0.5 / total, end], [0, index === total - 1 ? 0 : 0.45]);

  // Drives the scrolling captures, 0..1. Stacked: starts from the top of the client's page the
  // moment the card pins, and scrolls until the next card has covered it. Unstacked (phones):
  // follows the card's own journey through the screen instead.
  const { scrollYProgress: own } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const pinned = useTransform(progress, [start, end], [0, 1]);
  const passing = useTransform(own, [0.4, 0.9], [0, 1]);
  const travel = stacked ? pinned : passing;

  const { theme } = project;
  const number = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={ref}
      className="pointer-events-none px-3 pb-5 md:px-6 md:pb-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:pb-0 lg:pt-20 xl:px-14"
    >
      <motion.article
        className="pointer-events-auto relative mx-auto w-full max-w-[104rem] origin-top overflow-hidden rounded-[1.75rem] md:rounded-[2.25rem] lg:h-[min(47rem,calc(100vh-7.5rem))]"
        style={{
          scale: stacked ? scale : 1,
          top: stacked ? index * 14 : 0,
          backgroundColor: theme.bg,
          color: theme.fg,
        }}
      >
        <div className="grid h-full gap-10 p-6 pb-0 md:gap-12 md:p-10 md:pb-0 lg:grid-cols-12 lg:gap-6 lg:p-12 lg:pb-0 xl:p-14 xl:pb-0">
          {/* Words */}
          <div className="flex flex-col lg:col-span-5 lg:pb-12 xl:col-span-4 xl:pb-14">
            <div className="flex items-center justify-between gap-4">
              <p className="label" style={{ color: theme.accent }}>
                {number} <span style={{ color: theme.sub }}>/ {String(total).padStart(2, "0")}</span>
              </p>
              <p className="label text-right" style={{ color: theme.sub }}>
                {project.sector}
              </p>
            </div>

            <h3 className="display mt-8 text-[clamp(2.4rem,4.6vw,4.9rem)] lg:mt-auto">{project.name}</h3>
            {project.place ? (
              <p className="mt-3 font-serif text-xl italic md:text-2xl" style={{ color: theme.accent }}>
                {project.place}
              </p>
            ) : null}

            <p className="mt-5 max-w-md text-[1.0625rem] leading-relaxed" style={{ color: theme.sub }}>
              {project.summary}
            </p>

            <ul className="mt-6 flex flex-wrap gap-2">
              {project.built.map((item) => (
                <li
                  key={item}
                  className="rounded-full border px-3.5 py-1.5 text-[0.8125rem] font-medium"
                  style={{ borderColor: theme.line }}
                >
                  {item}
                </li>
              ))}
            </ul>

            <a
              href={project.url}
              target="_blank"
              rel="noopener"
              data-cursor="hover"
              className="group mt-8 inline-flex h-14 w-fit items-center gap-4 rounded-full pl-7 pr-2 text-base font-semibold transition-transform duration-500 ease-[var(--ease-expo)] hover:scale-[1.03]"
              style={{ backgroundColor: theme.fg, color: theme.bg }}
            >
              Visit the live site
              <span
                className="grid h-10 w-10 place-items-center rounded-full transition-transform duration-500 ease-[var(--ease-expo)] group-hover:rotate-45"
                style={{ backgroundColor: theme.bg, color: theme.fg }}
              >
                {ARROW}
              </span>
              <span className="sr-only"> for {project.name} (opens in a new tab)</span>
            </a>
          </div>

          {/* The site itself */}
          <a
            href={project.url}
            target="_blank"
            rel="noopener"
            tabIndex={-1}
            aria-hidden="true"
            data-cursor="label"
            data-cursor-label="Visit site"
            className="relative block self-end pl-[6%] md:pl-[8%] lg:col-span-7 lg:translate-y-[9%] lg:pl-[9%] xl:col-span-8"
          >
            <Devices project={project} travel={travel} still={still} />
          </a>
        </div>

        {/* Dims as the next card slides over */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-ink"
          style={{ opacity: stacked ? shade : 0 }}
        />
      </motion.article>
    </div>
  );
}

export function Work() {
  const stack = useRef<HTMLDivElement>(null);
  const stacked = useMediaQuery("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const { scrollYProgress } = useScroll({ target: stack, offset: ["start start", "end end"] });

  return (
    <section id="work" aria-labelledby="work-title" className="pt-24 md:pt-36">
      <div className="shell">
        <SectionHeading
          index="02"
          label="Selected work"
          title={"Real businesses.\n*Live* sites."}
          id="work-title"
        >
          <p>Every project below is live right now. Click through and have a look around.</p>
        </SectionHeading>
      </div>

      <div ref={stack} className="relative mt-14 lg:mt-10">
        {projects.map((project, i) => (
          <ProjectCard
            key={project.slug}
            project={project}
            index={i}
            total={projects.length}
            progress={scrollYProgress}
            stacked={stacked}
            still={reduced}
          />
        ))}
      </div>

      <div className="shell">
        <Reveal className="flex flex-col items-start justify-between gap-6 border-b border-white/10 py-12 md:flex-row md:items-center md:py-16">
          <p className="display max-w-3xl text-[clamp(1.6rem,3.2vw,3rem)] text-bone">
            Yours could be <span className="accent">next.</span>
          </p>
          <a href="#contact" className="link-sweep pb-1 text-lg font-medium text-bone-dim hover:text-bone">
            Tell us what you need
          </a>
        </Reveal>
      </div>
    </section>
  );
}
