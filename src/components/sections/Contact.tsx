"use client";

import { useInView } from "framer-motion";
import { useRef } from "react";

import { site } from "@/lib/site";

import { Terrain } from "../Terrain";
import { Reveal } from "../ui/Reveal";
import { RevealText } from "../ui/RevealText";
import { ContactForm } from "./ContactForm";

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const near = useInView(ref, { margin: "200px" });
  // The map is a second WebGL scene. It is not created until the visitor gets close.
  const arrived = useInView(ref, { margin: "600px", once: true });

  return (
    <section ref={ref} id="contact" aria-labelledby="contact-title" className="relative overflow-hidden">
      {/* The same mountain as the hero, now seen from directly above: you are at the top. */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(50%_50%_at_26%_42%,rgba(255,91,46,0.16)_0%,rgba(255,91,46,0)_70%)]" />
        {arrived ? (
          <Terrain view="map" active={near} className="absolute inset-0 h-full w-full opacity-55" />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--color-ink)_0%,rgba(7,7,8,0)_22%,rgba(7,7,8,0)_70%,var(--color-ink)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(42%_46%_at_24%_58%,rgba(7,7,8,0.78)_0%,rgba(7,7,8,0)_100%)]" />
      </div>

      <div className="shell relative py-28 md:py-44">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal y={14}>
              <p className="label flex items-center gap-3 text-mute">
                <span className="text-ember">05</span>
                <span className="h-px w-8 bg-white/20" />
                Start a project
              </p>
            </Reveal>
            <RevealText
              as="h2"
              id="contact-title"
              text={"Ready for\nthe *top?*"}
              className="display mt-6 text-[clamp(3rem,7.4vw,7.75rem)] text-bone"
            />
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-bone-dim md:text-lg">
                Tell us about your business and what you&rsquo;re after. A new site, more people finding you,
                an Instagram that runs itself, or a tool nobody else makes.
              </p>
            </Reveal>

            <Reveal
              delay={0.25}
              className="mt-10 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
            >
              <div>
                <p className="label text-mute">Email</p>
                <a
                  href={`mailto:${site.email}`}
                  className="link-sweep mt-2 inline-block pb-1 text-xl font-medium text-bone"
                >
                  {site.email}
                </a>
              </div>
              {site.phone ? (
                <div>
                  <p className="label text-mute">Phone</p>
                  <a
                    href={`tel:${site.phone.replace(/\s+/g, "")}`}
                    className="link-sweep mt-2 inline-block pb-1 text-xl font-medium text-bone"
                  >
                    {site.phone}
                  </a>
                </div>
              ) : null}
              {site.instagram ? (
                <div>
                  <p className="label text-mute">Instagram</p>
                  <a
                    href={`https://www.instagram.com/${site.instagram}`}
                    target="_blank"
                    rel="noopener"
                    className="link-sweep mt-2 inline-block pb-1 text-xl font-medium text-bone"
                  >
                    @{site.instagram}
                  </a>
                </div>
              ) : null}
            </Reveal>
          </div>

          <Reveal delay={0.1} className="lg:col-span-7 xl:col-span-6 xl:col-start-7">
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
