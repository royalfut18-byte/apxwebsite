/**
 * As the intro's curtain lifts, its wordmark flies up into the header and becomes the logo.
 *
 * The intro notes where its wordmark stands just before it hands over; the header's logo,
 * which appears in the same moment, starts from there and glides home (see Nav.tsx). The
 * glide is a single animation worked out once and handed to the browser, so it stays smooth
 * however busy the page is while the hero comes in.
 */
let launch: DOMRect | null = null;

export function noteLogoLaunch(rect: DOMRect | null) {
  launch = rect;
}

/** Where the flight starts, if there is one to make. */
export function logoLaunch() {
  return launch;
}

/** The flight has been made: later appearances of the logo stay put. */
export function clearLogoLaunch() {
  launch = null;
}
