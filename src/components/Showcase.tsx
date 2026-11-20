"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import { screens } from "@/lib/showcase";

/** One full turn at rest, in milliseconds. Must match `wall-turn` in globals.css. */
const TURN_MS = 96_000;
const COUNT = screens.length;
const STEP = 360 / COUNT;
/** How far each screen stands from the axis, in screen widths, for them to sit edge to edge. */
const SPREAD = 0.5 / Math.tan(Math.PI / COUNT);

/** A push dies away with this time constant (ms): about 95% gone after three of them. */
const TAU = 480;
/** How long a push is animated for. By then it has stopped, to within a quarter of a percent. */
const COAST_MS = TAU * 6;
const SAMPLES = 24;
/** The hardest the ring can be pushed, in degrees per millisecond (about a turn and a half a second). */
const MAX_PUSH = 0.55;
/** It arrives with a push worth this many degrees. */
const ENTRANCE_DEG = 150;
/** Scrolling the page by one pixel pushes it by this many degrees. */
const SCROLL_DEG_PER_PX = 0.11;
const HOVER_RATE = 0.3;

type Control = { push: (degPerMs: number) => void; setTurning: (on: boolean) => void };

/**
 * The hero's wall of work: real pages from live client sites, standing in a ring that
 * turns slowly. Drag it to spin it, scroll and it picks up speed, and the caption names
 * the client facing you.
 *
 * It is built from ordinary elements placed in 3D with CSS, so the browser's compositor
 * draws all of it: no canvas, and no script running per frame.
 *
 *  - The steady turn is one CSS animation on the ring (it runs before, and without, JavaScript).
 *  - Everything on top of that (the spin it arrives with, a flick, a scroll) is a push: one
 *    eased animation on a wrapper around the ring, started once and left to the browser.
 *  - Dragging sets that wrapper's angle directly, once per pointer event.
 */
export function Showcase({ show, paused = false }: { show: boolean; paused?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const spinner = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const control = useRef<Control | null>(null);
  const [front, setFront] = useState(0);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    const host = stage.current;
    const spin = spinner.current;
    const el = ring.current;
    if (!host || !spin || !el || typeof el.getAnimations !== "function") return;
    const turn = el.getAnimations().find((a) => (a as CSSAnimation).animationName === "wall-turn");
    if (!turn) return;

    // --- The steady turn -----------------------------------------------------------------
    let onScreen = false;
    let covered = false;
    let hovering = false;
    let dragging = false;
    let running: boolean | null = null;
    const steady = () => {
      const on = !reduced && onScreen && !covered && !dragging;
      if (on !== running) {
        running = on;
        if (on) turn.play();
        else turn.pause();
      }
    };

    // --- Pushes ----------------------------------------------------------------------------
    // The wrapper's angle follows  base + v * TAU * (1 - e^(-t / TAU)) : a push that dies away.
    // The same formula gives the animation its keyframes and tells the script where the
    // ring is at any moment, so the two never disagree.
    const motion = { base: 0, v: 0, at: 0 };
    let coast: Animation | null = null;
    const angleAt = (now: number) => motion.base + motion.v * TAU * (1 - Math.exp(-(now - motion.at) / TAU));
    const hold = (angle: number) => {
      motion.base = angle;
      motion.v = 0;
      motion.at = performance.now();
      spin.style.transform = `rotateY(${angle.toFixed(3)}deg)`;
      coast?.cancel();
      coast = null;
    };
    const push = (degPerMs: number) => {
      const now = performance.now();
      const speed = motion.v * Math.exp(-(now - motion.at) / TAU) + degPerMs;
      motion.base = angleAt(now);
      motion.v = Math.max(-MAX_PUSH, Math.min(MAX_PUSH, speed));
      motion.at = now;
      const frames = Array.from({ length: SAMPLES + 1 }, (_, i) => ({
        transform: `rotateY(${(motion.base + motion.v * TAU * (1 - Math.exp((-i / SAMPLES) * (COAST_MS / TAU)))).toFixed(3)}deg)`,
      }));
      spin.style.transform = frames[0].transform;
      coast?.cancel();
      coast = spin.animate(frames, { duration: COAST_MS, easing: "linear", fill: "forwards" });
    };

    control.current = {
      push,
      setTurning: (on) => {
        covered = !on;
        steady();
      },
    };

    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      steady();
    });
    io.observe(host);

    // Scrolling pushes it, in the direction of the scroll. (Gathered up and applied at most
    // twenty times a second: enough to feel immediate, without restarting the animation
    // on every scroll event.)
    let lastY = window.scrollY;
    let owed = 0;
    let timer = 0;
    const onScroll = () => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (reduced || !onScreen || covered || dragging) return;
      owed += dy;
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        const deg = Math.max(-70, Math.min(70, owed * SCROLL_DEG_PER_PX));
        owed = 0;
        if (deg) push(-deg / TAU);
      }, 50);
    };

    // Dragging turns it by hand.
    const degPerPx = () => {
      const width = host.querySelector<HTMLElement>(".wall-screen")?.offsetWidth || 320;
      return 180 / (Math.PI * width * SPREAD);
    };
    let drag: { id: number; x: number; angle: number; lastX: number; lastT: number; v: number } | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      const now = performance.now();
      const angle = angleAt(now);
      hold(angle);
      drag = { id: e.pointerId, x: e.clientX, angle, lastX: e.clientX, lastT: now, v: 0 };
      dragging = true;
      steady();
      host.setPointerCapture(e.pointerId);
      host.dataset.dragging = "";
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const now = performance.now();
      hold(drag.angle + (e.clientX - drag.x) * degPerPx());
      const dt = Math.max(1, now - drag.lastT);
      drag.v = drag.v * 0.6 + ((e.clientX - drag.lastX) / dt) * 0.4;
      drag.lastX = e.clientX;
      drag.lastT = now;
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      // Let go while moving and it keeps going, then coasts to a stop.
      const flick = performance.now() - drag.lastT < 80 ? drag.v * degPerPx() : 0;
      drag = null;
      dragging = false;
      delete host.dataset.dragging;
      if (Math.abs(flick) > 0.01) push(flick);
      steady();
    };

    // Under the mouse it slows, so a screen can be looked at.
    const onEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced || hovering) return;
      hovering = true;
      turn.updatePlaybackRate(HOVER_RATE);
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !hovering) return;
      hovering = false;
      turn.updatePlaybackRate(1);
    };

    // The view shifts a little with the mouse, which is what makes the ring feel solid.
    // (Only the vanishing point moves; a CSS transition smooths it.)
    let look = 0;
    let lookX = 0;
    let lookY = 0;
    const applyLook = () => {
      look = 0;
      host.style.perspectiveOrigin = `${(50 + lookX * 16).toFixed(2)}% ${(28 + lookY * 26).toFixed(2)}%`;
    };
    const onLook = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduced || !onScreen || covered || dragging) return;
      lookX = e.clientX / window.innerWidth - 0.5;
      lookY = e.clientY / window.innerHeight - 0.5;
      if (!look) look = requestAnimationFrame(applyLook);
    };

    // Which screen is facing the visitor, for the caption.
    const watch = window.setInterval(() => {
      if (!onScreen || covered) return;
      const steadyDeg = -(((Number(turn.currentTime) || 0) % TURN_MS) / TURN_MS) * 360;
      const total = steadyDeg + angleAt(performance.now());
      const index = ((Math.round(-total / STEP) % COUNT) + COUNT) % COUNT;
      setFront((was) => (was === index ? was : index));
    }, 250);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onLook, { passive: true });
    host.addEventListener("pointerdown", onDown);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerup", onUp);
    host.addEventListener("pointercancel", onUp);
    host.addEventListener("pointerenter", onEnter);
    host.addEventListener("pointerleave", onLeave);

    return () => {
      control.current = null;
      cancelAnimationFrame(look);
      window.clearTimeout(timer);
      window.clearInterval(watch);
      io.disconnect();
      coast?.cancel();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onLook);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  // Stop turning while the page has covered the hero.
  useEffect(() => {
    control.current?.setTurning(!paused);
  }, [paused, reduced]);

  // Arrive spinning, then settle.
  useEffect(() => {
    if (show && !reduced) control.current?.push(-ENTRANCE_DEG / TAU);
  }, [show, reduced]);

  const { project } = screens[front];

  return (
    <div aria-hidden="true" className="relative">
      <div
        ref={stage}
        className="wall"
        data-show={show ? "" : undefined}
        data-cursor="label"
        data-cursor-label="Drag"
        style={{ "--spread": SPREAD.toFixed(4) } as React.CSSProperties}
      >
        <div ref={spinner} className="wall-spin">
          <div ref={ring} className="wall-ring">
            {screens.map((screen, i) => (
              <div
                key={i}
                className="wall-screen"
                style={{ transform: `rotateY(${i * STEP}deg) translateZ(var(--r))` }}
              >
                <div
                  className="wall-rise"
                  data-reveal=""
                  // The screen facing the visitor arrives first, then its neighbours, outward.
                  style={{ "--order": Math.min(i, COUNT - i) } as React.CSSProperties}
                >
                  <div className="wall-bar">
                    <i />
                    <i />
                    <i />
                    <span>{screen.project.displayUrl}</span>
                  </div>
                  <Image
                    src={screen.image}
                    alt=""
                    sizes="(min-width: 768px) 28vw, 44vw"
                    loading={i < 2 || i === COUNT - 1 ? "eager" : "lazy"}
                    draggable={false}
                    className="block h-auto w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p key={project.slug} className="wall-caption label">
        <span className="pulse-dot block h-1.5 w-1.5 shrink-0 rounded-full bg-ember" />
        <span className="shrink-0 whitespace-nowrap text-bone">{project.name}</span>
        <span className="text-faint">/</span>
        <span className="truncate text-bone-dim">{project.sector}</span>
      </p>
    </div>
  );
}
