"use client";

import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * The APX mountain: a live topographic model drawn as contour lines.
 *
 * Written against raw WebGL2 on purpose. It is one mesh and one shader, so pulling in a
 * 3D library would cost more than the whole scene. Everything is computed on the GPU:
 * the height field in the vertex shader, the contour lines in the fragment shader.
 *
 * The scene pauses itself whenever it is off screen or the tab is hidden, and renders a
 * single still frame for visitors who ask for reduced motion.
 */

type TerrainProps = {
  className?: string;
  /** "peak" looks up at the summit from the valley. "map" looks straight down on it. */
  view?: "peak" | "map";
  /** 0..1. In the "peak" view this lifts the camera from the valley to above the summit. */
  progress?: MotionValue<number>;
  /** 0..1 fade for the whole scene, applied inside the shader so the silhouette fades too. */
  intensity?: MotionValue<number>;
  /** Hold rendering until this is true (used to keep the GPU idle behind the intro). */
  active?: boolean;
  /**
   * Receives the summit's position on every frame, in CSS pixels from the canvas's
   * top-left corner, so HTML can be pinned to the peak.
   */
  summit?: { x: MotionValue<number>; y: MotionValue<number> };
};

const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

// 2D simplex noise (Ashima Arts / Ian McEwan, MIT).
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`;

// The height field. Shared by both shaders: the vertex shader uses it to build the
// surface, the fragment shader re-evaluates it per pixel so the contour lines stay
// perfectly smooth however coarse the mesh is.
const HEIGHT = /* glsl */ `
uniform float uTime;
uniform float uSize;

float terrain(vec2 p) {
  float r = length(p);

  // Warp the domain a little so the massif is not perfectly round.
  vec2 q = p + 0.26 * vec2(snoise(p * 0.42 + 3.1), snoise(p * 0.42 - 7.7));
  float rq = length(q * vec2(1.0, 1.12));

  float summit = 1.42 * exp(-rq * 1.55);
  float massif = 0.86 * exp(-rq * rq * 0.42);
  float shoulder = 0.5 * exp(-dot(q - vec2(1.25, 0.55), q - vec2(1.25, 0.55)) * 1.5);

  // Ridges that radiate off the summit and die out toward the plain.
  float ridges = 0.0;
  float amp = 0.5;
  float weight = 1.0;
  vec2 rp = q * 0.95 + 11.0;
  for (int i = 0; i < 3; i++) {
    // Rounded-off ridge function: sharp enough to read as rock, smooth enough
    // that the contour lines flow instead of kinking.
    float sn = snoise(rp);
    float n = 1.0 - sqrt(sn * sn + 0.035);
    n *= n;
    ridges += n * amp * weight;
    weight = clamp(n * 1.5, 0.0, 1.0);
    rp = rp * 1.92 + 5.3;
    amp *= 0.4;
  }
  float ridgeMask = exp(-rq * 0.62) * smoothstep(0.05, 0.5, rq);

  float hills = 0.16 * (snoise(p * 0.55 + 20.0) * 0.5 + 0.5) + 0.045 * snoise(p * 1.3 - 4.0);
  float breathe = 0.02 * snoise(p * 0.6 + vec2(uTime * 0.05, -uTime * 0.035));
  float plain = smoothstep(uSize, uSize * 0.3, r);

  return summit + massif + shoulder + ridges * 0.62 * ridgeMask + (hills + breathe) * plain;
}
`;

const VERT = /* glsl */ `#version 300 es
precision highp float;

layout(location = 0) in vec2 aPos;

uniform mat4 uViewProj;
uniform vec2 uShift;

out vec3 vWorld;

invariant gl_Position;

${NOISE}
${HEIGHT}

void main() {
  vec2 p = aPos * uSize;
  vWorld = vec3(p.x, terrain(p), p.y);
  vec4 clip = uViewProj * vec4(vWorld, 1.0);
  clip.xy += uShift * clip.w;
  gl_Position = clip;
}
`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec3 vWorld;

uniform vec3 uCam;
uniform vec3 uBg;
uniform vec3 uLine;
uniform vec3 uEmber;
uniform vec2 uPointer;
uniform vec2 uRes;
uniform float uPeak;
uniform float uIntensity;
uniform float uFog;
uniform float uTorch;
uniform float uPass;
uniform float uThick;

out vec4 outColor;

${NOISE}
${HEIGHT}

float contour(float f, float width) {
  float w = fwidth(f);
  float d = abs(fract(f - 0.5) - 0.5);
  return 1.0 - smoothstep(w * (width - 0.55), w * (width + 0.55), d);
}

void main() {
  // The depth pre-pass only needs depth. Skip all the work.
  if (uPass < 0.5) {
    outColor = vec4(0.0);
    return;
  }

  float h = terrain(vWorld.xz);

  const float interval = 0.05;
  float f = h / interval;
  float density = fwidth(f);

  // A fine line every interval and a heavier index line every fifth, like a survey map.
  // Both fade out where they would crowd closer than a couple of pixels.
  float minor = contour(f, 0.8 * uThick) * (1.0 - smoothstep(0.3, 0.7, density * uThick));
  float major = contour(f / 5.0, 1.2 * uThick) * (1.0 - smoothstep(0.2, 0.5, density / 5.0 * uThick));

  float alt = clamp(h / uPeak, 0.0, 1.0);
  float r = length(vWorld.xz);
  float dist = length(vWorld - uCam);

  float fog = exp(-pow(max(dist * uFog, 0.0), 2.4));
  float edge = smoothstep(uSize, uSize * 0.55, r);

  // A band of light that climbs the mountain every few seconds.
  // (Squares are written out by hand: pow() with a negative base is undefined in GLSL.)
  float sweep = fract(uTime * 0.07);
  float bandD = (alt - sweep * 1.3 + 0.15) * 8.0;
  float band = exp(-bandD * bandD) * smoothstep(0.03, 0.22, alt);

  // The cursor acts like a torch on the slope.
  vec2 pd = (gl_FragCoord.xy - uPointer) / uRes.y;
  float torch = exp(-dot(pd, pd) * 20.0) * uTorch;

  float warm = smoothstep(0.34, 0.92, alt);
  vec3 col = mix(uLine, uEmber, clamp(warm + torch * 0.8 + band * 0.4, 0.0, 1.0));

  float lineA = max(minor * 0.5, major);
  lineA *= 0.6 + warm * 0.55 + band * 0.8 + torch * 1.2;
  lineA = clamp(lineA, 0.0, 1.0) * fog * edge;

  // Faint warm rim where the slope turns away from the eye, so the form reads in 3D.
  vec3 nx = cross(dFdx(vWorld), dFdy(vWorld));
  float nl = length(nx);
  vec3 n = nl > 0.0 ? nx / nl : vec3(0.0, 1.0, 0.0);
  vec3 v = normalize(uCam - vWorld);
  float facing = clamp(1.0 - abs(dot(n, v)), 0.0, 1.0);
  float rim = facing * facing * facing * facing * smoothstep(0.15, 0.8, alt);
  vec3 body = uBg + uEmber * rim * 0.11;

  // The very top is capped in solid ember, like the tip of the A in the wordmark.
  float cap = smoothstep(0.928, 0.94, alt);
  body = mix(body, uEmber, cap);
  lineA *= 1.0 - cap;

  // The body of the mountain is opaque: it hides what is behind it and shows up
  // as a true silhouette against the glow.
  float bodyA = edge * smoothstep(0.0, 0.45, fog + 0.3);

  float a = lineA + bodyA * (1.0 - lineA);
  vec3 rgb = col * lineA + body * bodyA * (1.0 - lineA);

  outColor = vec4(rgb, a) * uIntensity;
}
`;

// --- the same height field in JavaScript ---------------------------------------------
// Only used once, at start-up, to find where the summit is so a label can be pinned
// to it. It mirrors the GLSL above (minus the slow "breathing", which barely moves the peak).

const mod289 = (x: number) => x - Math.floor(x / 289) * 289;
const permute = (x: number) => mod289((x * 34 + 1) * x);

function snoise(x: number, y: number) {
  const C0 = 0.211324865405187;
  const C1 = 0.366025403784439;
  const C2 = -0.577350269189626;
  const C3 = 0.024390243902439;
  const s = (x + y) * C1;
  let ix = Math.floor(x + s);
  let iy = Math.floor(y + s);
  const t = (ix + iy) * C0;
  const x0x = x - ix + t;
  const x0y = y - iy + t;
  const i1x = x0x > x0y ? 1 : 0;
  const i1y = x0x > x0y ? 0 : 1;
  const x1x = x0x + C0 - i1x;
  const x1y = x0y + C0 - i1y;
  const x2x = x0x + C2;
  const x2y = x0y + C2;
  ix = mod289(ix);
  iy = mod289(iy);
  const corner = (px: number, cx: number, cy: number) => {
    let m = Math.max(0.5 - (cx * cx + cy * cy), 0);
    m *= m;
    m *= m;
    const gx = 2 * (px * C3 - Math.floor(px * C3)) - 1;
    const h = Math.abs(gx) - 0.5;
    const a0 = gx - Math.floor(gx + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    return m * (a0 * cx + h * cy);
  };
  return (
    130 *
    (corner(permute(permute(iy) + ix), x0x, x0y) +
      corner(permute(permute(iy + i1y) + ix + i1x), x1x, x1y) +
      corner(permute(permute(iy + 1) + ix + 1), x2x, x2y))
  );
}

function terrainHeight(px: number, pz: number) {
  const r = Math.hypot(px, pz);
  const qx = px + 0.26 * snoise(px * 0.42 + 3.1, pz * 0.42 + 3.1);
  const qz = pz + 0.26 * snoise(px * 0.42 - 7.7, pz * 0.42 - 7.7);
  const rq = Math.hypot(qx, qz * 1.12);
  const summit = 1.42 * Math.exp(-rq * 1.55);
  const massif = 0.86 * Math.exp(-rq * rq * 0.42);
  const sdx = qx - 1.25;
  const sdz = qz - 0.55;
  const shoulder = 0.5 * Math.exp(-(sdx * sdx + sdz * sdz) * 1.5);
  let ridges = 0;
  let amp = 0.5;
  let weight = 1;
  let rx = qx * 0.95 + 11;
  let rz = qz * 0.95 + 11;
  for (let i = 0; i < 3; i++) {
    const sn = snoise(rx, rz);
    let n = 1 - Math.sqrt(sn * sn + 0.035);
    n *= n;
    ridges += n * amp * weight;
    weight = Math.min(1, Math.max(0, n * 1.5));
    rx = rx * 1.92 + 5.3;
    rz = rz * 1.92 + 5.3;
    amp *= 0.4;
  }
  const edge = (e0: number, e1: number, v: number) => {
    const k = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };
  const ridgeMask = Math.exp(-rq * 0.62) * edge(0.05, 0.5, rq);
  const hills =
    0.16 * (snoise(px * 0.55 + 20, pz * 0.55 + 20) * 0.5 + 0.5) + 0.045 * snoise(px * 1.3 - 4, pz * 1.3 - 4);
  const plain = edge(SIZE, SIZE * 0.3, r);
  return summit + massif + shoulder + ridges * 0.62 * ridgeMask + hills * plain;
}

/**
 * Finds the summit of the mesh as drawn: a coarse-to-fine search for the highest point
 * of the height field, then a snap to the highest nearby grid vertex (the peak is a
 * sharp cusp, so the mesh tip sits a little below the true maximum).
 */
function findSummit(segments: number): Vec3 {
  let best: Vec3 = [0, -Infinity, 0];
  let span = 0.9;
  let steps = 15;
  for (let pass = 0; pass < 4; pass++) {
    const step = span / steps;
    const cx = pass === 0 ? 0 : best[0];
    const cz = pass === 0 ? 0 : best[2];
    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        const x = cx + i * step;
        const z = cz + j * step;
        const h = terrainHeight(x, z);
        if (h > best[1]) best = [x, h, z];
      }
    }
    span = step * 2;
    steps = 6;
  }

  const cell = (2 * SIZE) / segments;
  const col = Math.round((best[0] + SIZE) / cell);
  const row = Math.round((best[2] + SIZE) / cell);
  let vertex: Vec3 = [0, -Infinity, 0];
  for (let i = col - 2; i <= col + 2; i++) {
    for (let j = row - 2; j <= row + 2; j++) {
      const x = i * cell - SIZE;
      const z = j * cell - SIZE;
      const h = terrainHeight(x, z);
      if (h > vertex[1]) vertex = [x, h, z];
    }
  }
  return vertex;
}

// --- tiny column-major mat4 helpers -------------------------------------------------

type Vec3 = [number, number, number];

function perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
}

function lookAt(out: Float32Array, eye: Vec3, target: Vec3, up: Vec3) {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let l = Math.hypot(zx, zy, zz) || 1;
  zx /= l;
  zy /= l;
  zz /= l;
  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  l = Math.hypot(xx, xy, xz) || 1;
  xx /= l;
  xy /= l;
  xz /= l;
  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;
  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
}

function multiply(out: Float32Array, a: Float32Array, b: Float32Array) {
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const hexToRgb = (hex: string): Vec3 => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const BG = hexToRgb("#070708");
const LINE = hexToRgb("#f1eee7");
const EMBER = hexToRgb("#ff5b2e");
const SIZE = 5.2;
/** The hero summit never sits closer than this to the top of the canvas, in CSS pixels. */
const SUMMIT_CLEARANCE = 156;

// Adaptive resolution (see `measure` below).
const TUNE_WARMUP_MS = 2500; // let the page's own entrance animations finish first
const TUNE_WINDOW = 45; // frames averaged per reading
const TUNE_SLOW_MS = 24; // slower than about 42 frames a second
const TUNE_STEP = 0.8; // each step renders 80% of the previous width and height
const TUNE_FLOOR = 0.5;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Terrain shader failed to compile:", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

type Live = Pick<TerrainProps, "view" | "progress" | "intensity" | "active" | "summit">;

/**
 * Creates the WebGL scene on `canvas` and returns a function that tears it down.
 * `live` always holds the component's latest props; `wake` is handed a function that
 * restarts the render loop.
 */
function createScene(
  canvas: HTMLCanvasElement,
  live: { current: Live },
  wake: { current: (() => void) | null },
  fail: () => void,
): (() => void) | undefined {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: "high-performance",
  });
  if (!gl) {
    fail();
    return;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) {
    fail();
    return;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    fail();
    return;
  }
  gl.useProgram(program);

  // A flat grid. The vertex shader lifts it into a mountain.
  const coarse = window.matchMedia("(max-width: 767px)").matches;
  const N = coarse ? 190 : 270;
  const positions = new Float32Array((N + 1) * (N + 1) * 2);
  let k = 0;
  for (let z = 0; z <= N; z++) {
    for (let x = 0; x <= N; x++) {
      positions[k++] = (x / N) * 2 - 1;
      positions[k++] = (z / N) * 2 - 1;
    }
  }
  const indices = new Uint32Array(N * N * 6);
  k = 0;
  for (let z = 0; z < N; z++) {
    for (let x = 0; x < N; x++) {
      const a = z * (N + 1) + x;
      const b = a + 1;
      const c = a + N + 1;
      const d = c + 1;
      indices[k++] = a;
      indices[k++] = c;
      indices[k++] = b;
      indices[k++] = b;
      indices[k++] = c;
      indices[k++] = d;
    }
  }

  // The highest vertex: where the callout pins, and what "100% altitude" means in the shader.
  const peak = findSummit(N);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const U = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    viewProj: U("uViewProj"),
    shift: U("uShift"),
    time: U("uTime"),
    size: U("uSize"),
    cam: U("uCam"),
    bg: U("uBg"),
    line: U("uLine"),
    ember: U("uEmber"),
    pointer: U("uPointer"),
    res: U("uRes"),
    peak: U("uPeak"),
    intensity: U("uIntensity"),
    fog: U("uFog"),
    torch: U("uTorch"),
    pass: U("uPass"),
    thick: U("uThick"),
  };
  gl.uniform1f(u.size, SIZE);
  gl.uniform1f(u.peak, peak[1]);
  gl.uniform3fv(u.bg, BG);
  gl.uniform3fv(u.line, LINE);
  gl.uniform3fv(u.ember, EMBER);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  const proj = new Float32Array(16);
  const viewM = new Float32Array(16);
  const viewProj = new Float32Array(16);

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const state = {
    width: 1,
    height: 1,
    dpr: 1,
    time: reduced ? 14 : 0,
    last: 0,
    raf: 0,
    visible: false,
    // pointer, normalised to -1..1 across the canvas, eased
    px: 0,
    py: 0,
    tx: 0,
    ty: 0,
    // pointer in device pixels for the torch
    mx: -9999,
    my: -9999,
    torch: 0,
    torchTarget: 0,
    lost: false,
  };

  // Adaptive resolution. If frames keep arriving late, the canvas is rendered a step smaller
  // and stretched back up by CSS, which is what a struggling GPU needs. If two steps in a
  // row change nothing, the hold-up is elsewhere (a 30 Hz display, a battery saver capping
  // the frame rate), so the detail is put back and the scene is left alone from then on.
  const tune = {
    quality: 1, // multiplier on the canvas resolution
    good: 1, // the last quality that was shown to help (or the starting one)
    since: 0, // when the first frame was drawn
    frames: 0,
    total: 0,
    before: 0, // average frame time ahead of the latest step down
    misses: 0, // consecutive steps that made no difference
    skip: false, // ignore the next frame (it follows a pause)
    settled: reduced,
  };

  function measure(now: number, frameMs: number) {
    if (tune.settled) return;
    if (!tune.since) tune.since = now;
    if (tune.skip || frameMs <= 0) {
      tune.skip = false;
      return;
    }
    if (now - tune.since < TUNE_WARMUP_MS) return;

    tune.frames++;
    tune.total += Math.min(frameMs, 500);
    if (tune.frames < TUNE_WINDOW) return;

    const average = tune.total / tune.frames;
    tune.frames = 0;
    tune.total = 0;

    if (tune.before > 0) {
      if (average > tune.before * 0.88) {
        tune.misses++;
      } else {
        tune.misses = 0;
        tune.good = tune.quality;
      }
    }

    if (tune.misses >= 2) {
      tune.quality = tune.good;
      tune.settled = true;
      resize();
    } else if (average > TUNE_SLOW_MS && tune.quality > TUNE_FLOOR) {
      tune.before = average;
      tune.quality = Math.max(TUNE_FLOOR, tune.quality * TUNE_STEP);
      resize();
    } else {
      tune.settled = true;
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    // Cap the pixel count so large or dense displays do not pay for detail nobody can see.
    const budget = 2_400_000;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cssW * cssH * dpr * dpr > budget) dpr = Math.sqrt(budget / (cssW * cssH));
    dpr = Math.max(0.5, Math.max(0.75, dpr) * tune.quality);
    state.dpr = dpr;
    state.width = Math.round(cssW * dpr);
    state.height = Math.round(cssH * dpr);
    if (canvas.width !== state.width || canvas.height !== state.height) {
      canvas.width = state.width;
      canvas.height = state.height;
    }
  }

  function draw(now: number) {
    if (state.lost) return;
    const frameMs = state.last ? now - state.last : 0;
    const dt = frameMs ? Math.min(frameMs / 1000, 0.05) : 0.016;
    state.last = now;
    if (!reduced) state.time += dt;
    measure(now, frameMs);

    const ease = 1 - Math.exp(-dt * 3.2);
    state.px += (state.tx - state.px) * ease;
    state.py += (state.ty - state.py) * ease;
    state.torch += (state.torchTarget - state.torch) * (1 - Math.exp(-dt * 5));

    const { view: v, progress: prog, intensity: inten } = live.current;
    // With reduced motion the camera stays put: no scroll-driven fly-over.
    const p = reduced ? 0 : smooth(Math.min(1, Math.max(0, prog ? prog.get() : 0)));
    const aspect = state.width / state.height;
    const portrait = aspect < 0.9;

    let eye: Vec3;
    let target: Vec3;
    let up: Vec3 = [0, 1, 0];
    let fov: number;
    let shiftX: number;
    let shiftY: number;
    let fog: number;

    if (v === "map") {
      // Straight down, turning slowly like a map on a table.
      const a = state.time * 0.02;
      eye = [state.px * 0.35, 9.5, 0.001 + state.py * 0.35];
      target = [0, 0, 0];
      up = [Math.sin(a), 0, -Math.cos(a)];
      fov = (portrait ? 46 : 30) * (Math.PI / 180);
      shiftX = portrait ? 0 : -0.46;
      shiftY = portrait ? 0.42 : 0.04;
      fog = 0.062;
    } else {
      const orbit = 0.62 + state.time * 0.028 + state.px * 0.2;
      const radius = mix(portrait ? 7.4 : 6.1, 3.6, p);
      const height = mix(portrait ? 2.7 : 2.35, 6.2, p) - state.py * 0.25;
      eye = [Math.sin(orbit) * radius, height, Math.cos(orbit) * radius];
      target = [0, mix(1.0, 0.3, p), 0];
      fov = (portrait ? 44 : 34) * (Math.PI / 180);
      shiftX = mix(portrait ? 0.06 : 0.5, 0, p);
      shiftY = mix(portrait ? 0.3 : -0.1, 0, p);
      fog = mix(0.1, 0.085, p);
    }

    perspective(proj, fov, aspect, 0.1, 60);
    lookAt(viewM, eye, target, up);
    multiply(viewProj, proj, viewM);

    // Where the summit lands on screen, before the screen-space shift is applied.
    const m = viewProj;
    const cw = m[3] * peak[0] + m[7] * peak[1] + m[11] * peak[2] + m[15];
    const sx = cw > 0 ? (m[0] * peak[0] + m[4] * peak[1] + m[8] * peak[2] + m[12]) / cw : 0;
    const sy = cw > 0 ? (m[1] * peak[0] + m[5] * peak[1] + m[9] * peak[2] + m[13]) / cw : 0;
    const cssWidth = state.width / state.dpr;
    const cssHeight = state.height / state.dpr;

    // On short screens the summit would poke up behind the header. Slide the whole scene
    // down just far enough to keep it, and its label, clear. Relaxes as the camera lifts.
    // (Phones are left alone: there the mountain is a backdrop and carries no label.)
    if (v === "peak" && cssWidth >= 768) {
      const lowest = 1 - (2 * SUMMIT_CLEARANCE) / cssHeight - sy;
      shiftY = Math.min(shiftY, mix(lowest, 0, p));
    }

    // Tell whoever is listening where the summit is.
    const pin = live.current.summit;
    if (pin && cw > 0) {
      pin.x.set(((sx + shiftX + 1) / 2) * cssWidth);
      pin.y.set(((1 - (sy + shiftY)) / 2) * cssHeight);
    }

    gl!.viewport(0, 0, state.width, state.height);
    gl!.uniformMatrix4fv(u.viewProj, false, viewProj);
    gl!.uniform2f(u.shift, shiftX, shiftY);
    gl!.uniform1f(u.time, state.time);
    gl!.uniform3f(u.cam, eye[0], eye[1], eye[2]);
    gl!.uniform2f(u.pointer, state.mx, state.my);
    gl!.uniform2f(u.res, state.width, state.height);
    gl!.uniform1f(u.intensity, inten ? Math.min(1, Math.max(0, inten.get())) : 1);
    gl!.uniform1f(u.fog, fog);
    gl!.uniform1f(u.torch, state.torch);
    // Keep lines a steady visual weight on dense screens instead of hairline-thin.
    gl!.uniform1f(u.thick, Math.max(1, state.dpr * 0.7));

    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    // Pass 1: depth only, so only the nearest surface is ever shaded.
    gl!.uniform1f(u.pass, 0);
    gl!.colorMask(false, false, false, false);
    gl!.depthMask(true);
    gl!.depthFunc(gl!.LESS);
    gl!.disable(gl!.BLEND);
    gl!.drawElements(gl!.TRIANGLES, indices.length, gl!.UNSIGNED_INT, 0);

    // Pass 2: colour, blended over whatever sits behind the canvas.
    gl!.uniform1f(u.pass, 1);
    gl!.colorMask(true, true, true, true);
    gl!.depthMask(false);
    gl!.depthFunc(gl!.LEQUAL);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.drawElements(gl!.TRIANGLES, indices.length, gl!.UNSIGNED_INT, 0);
  }

  function loop(now: number) {
    state.raf = 0;
    if (!state.visible || document.hidden || !live.current.active) return;
    draw(now);
    if (!reduced) state.raf = requestAnimationFrame(loop);
  }

  function kick() {
    if (!state.raf && state.visible && !document.hidden) {
      state.last = 0;
      state.raf = requestAnimationFrame(loop);
    }
  }

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
    state.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    state.ty = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    state.tx = Math.max(-1, Math.min(1, state.tx));
    state.ty = Math.max(-1, Math.min(1, state.ty));
    state.mx = (e.clientX - rect.left) * state.dpr;
    state.my = (rect.height - (e.clientY - rect.top)) * state.dpr;
    state.torchTarget = inside ? 1 : 0;
  }
  function onPointerLeave() {
    state.torchTarget = 0;
  }

  const ro = new ResizeObserver(() => {
    resize();
    if (reduced) kick();
  });
  ro.observe(canvas);

  const io = new IntersectionObserver(
    ([entry]) => {
      state.visible = entry.isIntersecting;
      if (state.visible) kick();
    },
    { rootMargin: "80px" },
  );
  io.observe(canvas);

  const onVisibility = () => {
    tune.skip = true;
    kick();
  };
  const onLost = (e: Event) => {
    e.preventDefault();
    state.lost = true;
    fail();
  };

  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onLost);
  if (finePointer && !reduced) {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);
  }

  resize();
  wake.current = kick;

  // A still frame has no loop to pick up changes, so redraw when the fade value moves.
  const unsubscribe = reduced ? live.current.intensity?.on("change", kick) : undefined;

  return () => {
    wake.current = null;
    unsubscribe?.();
    cancelAnimationFrame(state.raf);
    ro.disconnect();
    io.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    gl.deleteBuffer(vbo);
    gl.deleteBuffer(ibo);
    gl.deleteVertexArray(vao);
    gl.deleteProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
  };
}

export function Terrain({
  className,
  view = "peak",
  progress,
  intensity,
  active = true,
  summit,
}: TerrainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);

  // Latest props for the render loop without restarting WebGL.
  const live = useRef({ view, progress, intensity, active, summit });
  const wake = useRef<(() => void) | null>(null);
  useEffect(() => {
    live.current = { view, progress, intensity, active, summit };
    if (active) wake.current?.();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Compiling shaders and building the mesh is the heaviest thing this page does, and
    // nothing needs it in the first moments. Do it when the browser is idle instead of
    // during hydration.
    let dispose: (() => void) | undefined;
    let cancelled = false;
    const begin = () => {
      if (!cancelled) dispose = createScene(canvas, live, wake, () => setFailed(true));
    };
    const idle = typeof window.requestIdleCallback === "function";
    const handle = idle
      ? window.requestIdleCallback(begin, { timeout: 1200 })
      : window.setTimeout(begin, 200);

    return () => {
      cancelled = true;
      if (idle) window.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      dispose?.();
    };
  }, []);

  if (failed) return null;

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
