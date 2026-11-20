import { LETTERS, STROKE } from "./Logo";

/**
 * The wordmark as the intro's closing piece: three solid letters that swing in out of the
 * dark, one after another, and lock together. As the last one lands the tip of the A
 * catches light (a ring, a few sparks, a glow behind), and a band of colour runs through
 * the letters. Then the depth folds away, leaving the flat wordmark that flies to the header.
 *
 * Each letter is a stack of thin copies of itself, a hair apart in depth, which reads as a
 * solid block when it turns. The whole wordmark sways once as they land, to show it. Everything that moves is a transform or an opacity, driven by
 * the keyframes in globals.css ("Intro: the wordmark"), so the browser's compositor runs
 * the whole thing by itself, however busy the page is.
 */

/** The wordmark's box, in its own units (see Logo.tsx). */
const WIDTH = 179;
const HEIGHT = 56;

/** Where each letter sits in that box. */
const GLYPHS = [
  { name: "a", x: 0, w: 56, paths: [LETTERS[0]] },
  { name: "p", x: 68, w: 43.5, paths: [LETTERS[1]] },
  { name: "x", x: 121.16, w: 57.68, paths: [LETTERS[2], LETTERS[3]] },
];

/** The tip of the A: its position in the box, and how far down the ember runs. */
const APEX = { x: 28, y: 7.5, depth: 15.5 };

/** How many copies make up a letter's depth. */
const SLABS = 10;

// The sides of the letters run from ember at the face to violet at the back: the colours
// of the curtain that lifts next.
const STOPS = [
  [255, 91, 46],
  [255, 61, 127],
  [122, 69, 255],
];
function side(t: number) {
  const at = t * (STOPS.length - 1);
  const i = Math.min(STOPS.length - 2, Math.floor(at));
  const mixed = STOPS[i].map((v, k) => Math.round(v + (STOPS[i + 1][k] - v) * (at - i)));
  return `rgb(${mixed.join(" ")})`;
}
const SIDES = Array.from({ length: SLABS }, (_, k) => side(k / (SLABS - 1)));

const SPARKS = [-162, -128, -96, -64, -31, 4, 176, 208];

// The band of colour is only seen through the letters: this is their shape, as a mask.
const MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${WIDTH} ${HEIGHT}'><g fill='none' stroke='#000' stroke-width='${STROKE}'>${LETTERS.map((d) => `<path d='${d}'/>`).join("")}</g></svg>`,
)}")`;

const share = (v: number, of: number) => `${(v / of) * 100}%`;

function Strokes({
  paths,
  x,
  w,
  height = HEIGHT,
}: {
  paths: string[];
  x: number;
  w: number;
  height?: number;
}) {
  return (
    <svg viewBox={`${x} 0 ${w} ${height}`} fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={STROKE} strokeLinejoin="miter">
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

export function LogoAssemble() {
  return (
    <>
      <span className="logo-glow" />

      <span className="logo-turn">
        {GLYPHS.map((glyph, i) => (
          <span
            key={glyph.name}
            className="logo-glyph"
            style={
              { left: share(glyph.x, WIDTH), width: share(glyph.w, WIDTH), "--i": i } as React.CSSProperties
            }
          >
            {/* Back to front: the furthest copy first. */}
            {SIDES.map((_, k) => (
              <span
                key={k}
                className="logo-slab"
                style={{ "--k": SLABS - k, color: SIDES[SLABS - 1 - k] } as React.CSSProperties}
              >
                <Strokes paths={glyph.paths} x={glyph.x} w={glyph.w} />
              </span>
            ))}
            <span className="logo-face">
              <Strokes paths={glyph.paths} x={glyph.x} w={glyph.w} />
            </span>
            {i === 0 && (
              <span className="logo-tip" style={{ height: share(APEX.depth, HEIGHT) }}>
                <Strokes paths={glyph.paths} x={glyph.x} w={glyph.w} height={APEX.depth} />
              </span>
            )}
          </span>
        ))}

        {/* The flare at the tip of the A */}
        <span className="logo-burst" style={{ left: share(APEX.x, WIDTH), top: share(APEX.y, HEIGHT) }}>
          <i className="logo-ring" />
          <i className="logo-ring" />
          {SPARKS.map((angle, n) => (
            <i
              key={angle}
              className="logo-spark"
              style={{ "--a": `${angle}deg`, "--n": n } as React.CSSProperties}
            />
          ))}
        </span>

        <span className="logo-sheen" style={{ WebkitMaskImage: MASK, maskImage: MASK }}>
          <i />
        </span>
      </span>
    </>
  );
}
