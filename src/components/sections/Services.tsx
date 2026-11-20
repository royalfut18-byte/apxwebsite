"use client";

import { motion, useInView, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { scrollToTarget } from "@/lib/scroll";
import { services, type ServiceKey } from "@/lib/site";

import { SeoDemo } from "../demos/SeoDemo";
import { SmsDemo } from "../demos/SmsDemo";
import { SocialDemo } from "../demos/SocialDemo";
import { WebsiteDemo } from "../demos/WebsiteDemo";
import { Reveal } from "../ui/Reveal";
import { SectionHeading } from "../ui/SectionHeading";

const DEMOS: Record<ServiceKey, React.ComponentType> = {
  websites: WebsiteDemo,
  seo: SeoDemo,
  social: SocialDemo,
  tools: SmsDemo,
};

const CAPTIONS: Record<ServiceKey, string> = {
  websites: "Designed, built, and it works on every screen",
  seo: "Climbing the results for the searches that matter",
  social: "A week of posts, out on schedule",
  tools: "One message, your whole customer list",
};

/** The demos are drawn at one size. On roomier stages they are scaled up to fill the space. */
const DEMO_BASE_WIDTH = 640;
const DEMO_MAX_SCALE = 1.45;

/** The stage each demo plays on. */
function Stage({ service }: { service: (typeof services)[number] }) {
  const Demo = DEMOS[service.key];
  const stage = useRef<HTMLDivElement>(null);
  const scale = useMotionValue(1);
  const inverse = useTransform(scale, (v) => `${100 / v}%`);
  // The demo is only created once its stage is close to the screen. Until then (and in
  // whichever of the two layouts is not showing) the stage is an empty frame.
  const near = useInView(stage, { once: true, margin: "600px 0px" });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      scale.set(Math.min(DEMO_MAX_SCALE, Math.max(1, entry.contentRect.width / DEMO_BASE_WIDTH)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [scale]);

  return (
    <div
      ref={stage}
      className="relative flex aspect-[4/3.3] w-full flex-col overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-ink-800 sm:aspect-[4/3] lg:aspect-auto lg:h-[min(36rem,74vh)]"
    >
      {/* Survey-map dots that fade toward the edges, and a low ember glow. All three are
          plain gradients: no masks or blur filters for the browser to work out. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(75%_75%_at_50%_45%,transparent,var(--color-ink-800))]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(62%_58%_at_50%_100%,rgba(255,91,46,0.17),rgba(255,91,46,0.12)_30%,rgba(255,91,46,0.045)_62%,transparent)]"
      />
      <div className="relative flex items-center justify-between px-5 pt-5 md:px-7 md:pt-6">
        <span className="label text-faint">Fig. {service.index}</span>
        <span className="label hidden text-faint sm:block">{CAPTIONS[service.key]}</span>
      </div>
      <div className="relative grid min-h-0 flex-1 place-items-center p-5 md:p-8">
        {/* Laid out smaller by the same factor it is scaled by, so it exactly fills the stage. */}
        <motion.div style={{ scale, width: inverse, height: inverse }}>{near && <Demo />}</motion.div>
      </div>
    </div>
  );
}

/** Reports when a panel is crossing the middle of the screen. */
function Panel({
  index,
  onActive,
  children,
}: {
  index: number;
  onActive: (index: number) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const centred = useInView(ref, { margin: "-50% 0px -50% 0px" });
  useEffect(() => {
    if (centred) onActive(index);
  }, [centred, index, onActive]);
  return (
    <div ref={ref} id={`service-${services[index].key}`} className="flex min-h-[78vh] items-center py-6">
      {children}
    </div>
  );
}

export function Services() {
  const [active, setActive] = useState(0);

  return (
    <section id="services" aria-labelledby="services-title" className="shell pb-24 pt-24 md:pb-36 md:pt-36">
      <SectionHeading
        index="01"
        label="What we do"
        title={"Everything it takes|to get you *there.*"}
        id="services-title"
      >
        <p>Four services that work better together. Take one, or hand us the lot.</p>
      </SectionHeading>

      {/* Desktop: the list stays pinned while the demos scroll past. */}
      <div className="mt-20 hidden grid-cols-12 gap-10 lg:grid xl:gap-16">
        <div className="col-span-5">
          <div className="sticky top-0 flex h-screen flex-col justify-center py-24">
            <ul className="border-t border-white/10">
              {services.map((service, i) => {
                const on = i === active;
                return (
                  <li key={service.key} className="border-b border-white/10">
                    <h3>
                      <button
                        type="button"
                        onClick={() => scrollToTarget(`#service-${service.key}`)}
                        aria-expanded={on}
                        className="group flex w-full items-baseline gap-5 py-5 text-left"
                      >
                        <span
                          className={cn(
                            "label w-7 shrink-0 transition-colors duration-500",
                            on ? "text-ember" : "text-faint",
                          )}
                        >
                          {service.index}
                        </span>
                        <span
                          className={cn(
                            "display text-[clamp(1.9rem,3vw,3.1rem)] transition-colors duration-500",
                            on ? "text-bone" : "text-faint group-hover:text-bone-dim",
                          )}
                        >
                          {service.title}
                        </span>
                        <span
                          aria-hidden="true"
                          className={cn(
                            "ml-auto block h-2 w-2 shrink-0 self-center rounded-full bg-ember transition-[scale,opacity] duration-500 ease-[var(--ease-expo)]",
                            on ? "scale-100 opacity-100" : "scale-0 opacity-0",
                          )}
                        />
                      </button>
                    </h3>
                    {/* Opens by animating a grid row from 0fr to 1fr: the browser does it
                        natively, with no script measuring heights on every frame. */}
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-600 ease-[var(--ease-expo)] motion-reduce:transition-none",
                        on ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                      )}
                    >
                      <div
                        className={cn(
                          "min-h-0 overflow-hidden transition-[opacity,visibility] duration-600 ease-[var(--ease-expo)] motion-reduce:transition-none",
                          on ? "visible opacity-100" : "invisible opacity-0",
                        )}
                      >
                        <div className="pb-7 pl-12 pr-6">
                          <p className="accent text-2xl">{service.kicker}</p>
                          <p className="mt-3 max-w-md text-[1.0625rem] leading-relaxed text-bone-dim">
                            {service.body}
                          </p>
                          <ul className="mt-5 flex flex-wrap gap-2">
                            {service.points.map((point) => (
                              <li
                                key={point}
                                className="rounded-full border border-white/12 px-3.5 py-1.5 text-[0.8125rem] font-medium text-bone-dim"
                              >
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="col-span-7">
          {services.map((service, i) => (
            <Panel key={service.key} index={i} onActive={setActive}>
              <Stage service={service} />
            </Panel>
          ))}
        </div>
      </div>

      {/* Mobile and tablet: one card per service. */}
      <ul className="mt-14 grid gap-16 lg:hidden">
        {services.map((service) => (
          <li key={service.key}>
            <Reveal>
              <div className="flex items-baseline gap-4">
                <span className="label text-ember">{service.index}</span>
                <h3 className="display text-[clamp(2.1rem,9vw,3.25rem)] text-bone">{service.title}</h3>
              </div>
              <p className="accent mt-3 text-2xl">{service.kicker}</p>
              <p className="mt-3 max-w-xl text-[1.0625rem] leading-relaxed text-bone-dim">{service.body}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {service.points.map((point) => (
                  <li
                    key={point}
                    className="rounded-full border border-white/12 px-3.5 py-1.5 text-[0.8125rem] font-medium text-bone-dim"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="mt-7">
              <Stage service={service} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
