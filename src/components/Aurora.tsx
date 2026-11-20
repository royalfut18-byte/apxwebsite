"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * A slow, flowing wash of coloured light: the glow behind the hero, the contact section
 * and the 404 page.
 *
 * It is drawn by a small shader, but at a fraction of the size it is shown at (240 pixels
 * on its longest side) and stretched up by the browser. Light this soft has no detail to
 * lose, so it looks the same and costs almost nothing: any phone can draw it. It runs at
 * 30 frames a second, stops whenever it is off screen or the tab is hidden, and holds a
 * single frame for visitors who ask for reduced motion.
 *
 * Underneath sits a plain CSS gradient in the same colours. That is what shows before the
 * shader has started, without JavaScript, on the rare browser with no WebGL, and on
 * computers with graphics acceleration switched off. (There the shader would be drawn by
 * the processor, which is the one place it is not cheap, so it is never started.)
 */

type AuroraProps = {
  className?: string;
  /** Any number. Gives each instance its own pattern. */
  seed?: number;
  /** Where the light is centred, as fractions of the box. [0, 0] is the top-left corner. */
  focus?: [number, number];
  /** How far it reaches from there, as fractions of the box's width and height. */
  reach?: [number, number];
  /** Overall strength, 0..1. */
  gain?: number;
  /**
   * Moves the focus without re-rendering: called on every frame, returns an offset in the
   * same units as `focus`. The light eases toward it, so it can follow a pointer or a scroll.
   */
  shift?: () => [number, number];
  /** Hold off drawing until true (the hero waits for the intro this way). */
  active?: boolean;
};

const LONG_SIDE = 240;
const FRAME_MS = 1000 / 30;

// Ember, rose and violet: the three colours of the glow, as linear-ish RGB.
const EMBER = [1.0, 0.36, 0.18];
const ROSE = [1.0, 0.24, 0.5];
const VIOLET = [0.44, 0.26, 1.0];

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG = /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uSeed;
uniform vec2 uFocus;
uniform vec2 uReach;
uniform float uGain;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;

// Hash without sine (Dave Hoskins), so it behaves the same on every GPU.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(13.1, 7.7);
    a *= 0.5;
  }
  return v / 0.875;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  uv.y = 1.0 - uv.y;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y) * 1.25 + uSeed * 7.31;
  float t = uTime * 0.05;

  // Noise bent through itself twice: that is what makes it drift like light in smoke
  // instead of sliding past like a texture.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t * 0.8)));
  vec2 r = vec2(
    fbm(p + 2.0 * q + vec2(1.7 + t * 0.6, 9.2)),
    fbm(p + 2.0 * q + vec2(8.3, 2.8 - t * 0.45))
  );
  float n = fbm(p + 2.2 * r);

  // Colour runs violet to rose to ember across the width, pushed around by the flow.
  float k = clamp(uv.x * 0.6 + 0.2 + (r.x - 0.5) * 1.15 + (q.y - 0.5) * 0.5, 0.0, 1.0);
  vec3 col = mix(uC, uB, smoothstep(0.1, 0.42, k));
  col = mix(col, uA, smoothstep(0.38, 0.74, k));

  // Where the light pools, with brighter ribbons running through it.
  float pool = smoothstep(0.2, 0.76, n);
  float ribbon = 1.0 - abs(2.0 * r.y - 1.0);
  ribbon = ribbon * ribbon;
  float light = pool * (0.42 + 0.78 * ribbon);

  // Keep it inside a soft ellipse around the focus.
  float d = length((uv - uFocus) / uReach);
  float env = 1.0 - smoothstep(0.0, 1.0, d);
  env = env * env * (3.0 - 2.0 * env);

  float a = clamp(light * env * uGain, 0.0, 1.0);
  // A little extra lift in the brightest parts, so the core glows rather than sits flat.
  col += (1.0 - col) * 0.18 * a * a;
  gl_FragColor = vec4(col * a, a);
}
`;

/** One soft pool of colour for the still version: an elliptical gradient, as CSS. */
function pool(rgb: number[], alpha: number, x: number, y: number, w: number, h: number) {
  const c = (a: number) => `rgba(${rgb.join(", ")}, ${a.toFixed(3)})`;
  return `radial-gradient(${w}% ${h}% at ${x}% ${y}%, ${c(alpha)} 0%, ${c(alpha * 0.5)} 42%, ${c(0)} 100%)`;
}

export function Aurora({
  className,
  seed = 0,
  focus = [0.5, 0.5],
  reach = [0.7, 0.7],
  gain = 1,
  shift,
  active = true,
}: AuroraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  // Latest props for the loop, and a way to restart it, without rebuilding the scene.
  const latest = useRef({ active, focus, reach, gain, shift });
  const wake = useRef<(() => void) | null>(null);
  useEffect(() => {
    latest.current = { active, focus, reach, gain, shift };
    if (active) wake.current?.();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: "low-power",
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) return;

    // Some browsers hand over a software renderer without calling it a caveat. Its name
    // gives it away (SwiftShader, llvmpipe, Microsoft Basic Render Driver and friends).
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "");
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      return;
    }

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, "aPos");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== "production")
        console.error("Aurora shader:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    // One triangle that covers the whole canvas.
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uRes = u("uRes");
    const uTime = u("uTime");
    const uFocus = u("uFocus");
    const uReach = u("uReach");
    const uGain = u("uGain");
    gl.uniform1f(u("uSeed"), seed);
    gl.uniform3fv(u("uA"), EMBER);
    gl.uniform3fv(u("uB"), ROSE);
    gl.uniform3fv(u("uC"), VIOLET);
    gl.clearColor(0, 0, 0, 0);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
      raf: 0,
      last: 0,
      time: seed * 40 + (reduced ? 60 : 0),
      visible: false,
      drawn: false,
      lost: false,
      // where the focus has drifted to (see `shift`)
      dx: 0,
      dy: 0,
    };

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      const longest = Math.max(rect.width, rect.height, 1);
      const scale = LONG_SIDE / longest;
      const w = Math.max(2, Math.round(rect.width * scale));
      const h = Math.max(2, Math.round(rect.height * scale));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        state.last = 0; // draw on the very next frame: resizing wipes the canvas
      }
    }

    function draw() {
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      const now = latest.current;
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform1f(uTime, state.time);
      const [tx, ty] = now.shift ? now.shift() : [0, 0];
      state.dx += (tx - state.dx) * 0.09;
      state.dy += (ty - state.dy) * 0.09;
      gl!.uniform2f(uFocus, now.focus[0] + state.dx, now.focus[1] + state.dy);
      gl!.uniform2f(uReach, now.reach[0], now.reach[1]);
      gl!.uniform1f(uGain, now.gain);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
      if (!state.drawn) {
        state.drawn = true;
        setLive(true);
      }
    }

    function loop(now: number) {
      state.raf = 0;
      if (state.lost || !state.visible || document.hidden || !latest.current.active) return;
      const since = state.last ? now - state.last : FRAME_MS;
      if (since >= FRAME_MS - 2) {
        if (!reduced) state.time += Math.min(since, 100) / 1000;
        state.last = now;
        draw();
      }
      if (!reduced) state.raf = requestAnimationFrame(loop);
    }
    const kick = () => {
      if (!state.raf && state.visible && !document.hidden && !state.lost) {
        state.last = 0;
        state.raf = requestAnimationFrame(loop);
      }
    };
    wake.current = kick;

    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      ([entry]) => {
        state.visible = entry.isIntersecting;
        if (state.visible) kick();
      },
      { rootMargin: "100px" },
    );
    io.observe(canvas);
    const onLost = (e: Event) => {
      e.preventDefault();
      state.lost = true;
      setLive(false);
    };
    document.addEventListener("visibilitychange", kick);
    canvas.addEventListener("webglcontextlost", onLost);
    resize();

    return () => {
      wake.current = null;
      cancelAnimationFrame(state.raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
    // Built once. Position and strength are read from the latest props on every frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fx, fy] = focus;
  const [rx, ry] = reach;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none overflow-hidden", className)}>
      {/* The still version: two soft pools of the same colours. */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-[1600ms]",
          live ? "opacity-0" : "opacity-100",
        )}
        style={{
          backgroundImage: [
            pool([255, 61, 127], 0.62 * gain, fx * 100 - rx * 6, fy * 100 - ry * 8, rx * 50, ry * 78),
            pool([255, 91, 46], 0.6 * gain, fx * 100 + rx * 36, fy * 100 + ry * 4, rx * 54, ry * 74),
            pool([122, 69, 255], 0.56 * gain, fx * 100 - rx * 40, fy * 100 + ry * 6, rx * 52, ry * 76),
          ].join(", "),
        }}
      />
      <canvas
        ref={canvasRef}
        className={cn(
          "absolute inset-0 h-full w-full transition-opacity duration-[1600ms]",
          live ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
