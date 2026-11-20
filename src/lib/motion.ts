/**
 * How much the site moves.
 *
 * Every visitor gets the full animations, whatever their device is set to. Anyone can switch
 * them off (and on again) from the foot of the page; that choice is kept in the browser.
 *
 * The answer is worked out in three places, from the same sources, and they always agree:
 * MOTION_SCRIPT (inline in <head>, before anything is painted, which writes it to
 * <html data-motion="...">), the stylesheet, which reads that attribute, and the
 * components, through `useReducedMotion`.
 */
export type Motion = "full" | "reduced";

const KEY = "apx-motion";
/** `?motion=full` or `?motion=reduced` in the address decides it for that visit alone. */
const PARAM = "motion";

const valid = (value: string | null | undefined): Motion | null =>
  value === "full" || value === "reduced" ? value : null;

/** What the visitor has asked for on this site, if anything. */
export function chosenMotion(): Motion | null {
  let choice: Motion | null = null;
  try {
    choice = valid(new URLSearchParams(window.location.search).get(PARAM));
  } catch {
    // An address that cannot be read is treated as carrying no choice.
  }
  if (choice) return choice;
  try {
    return valid(window.localStorage.getItem(KEY));
  } catch {
    // Storage can be switched off entirely; then there is nothing remembered.
    return null;
  }
}

let cache: Motion | null = null;

/** The answer: the visitor's choice if they have made one, otherwise the full animations. */
export function currentMotion(): Motion {
  if (cache === null) cache = chosenMotion() ?? "full";
  return cache;
}

/** Writes the answer where the stylesheet can see it. */
export function applyMotion() {
  document.documentElement.setAttribute("data-motion", currentMotion());
}

/** Remembers a choice. False where the browser will not store it. */
export function rememberMotion(choice: Motion) {
  try {
    window.localStorage.setItem(KEY, choice);
    return true;
  } catch {
    return false;
  }
}

/**
 * Switches the animations on or off, and starts the page again from the top so that every
 * part of it, the intro included, begins in the right state.
 */
export function chooseMotion(choice: Motion) {
  const url = new URL(window.location.href);
  url.hash = "";
  // Where the browser will not remember it, the address carries the choice instead.
  if (rememberMotion(choice)) url.searchParams.delete(PARAM);
  else url.searchParams.set(PARAM, choice);
  window.location.replace(url.toString());
}

const listeners = new Set<() => void>();
let wired = false;

/** For `useReducedMotion`: tells React when another tab changes the answer. */
export function subscribeMotion(onChange: () => void) {
  if (!wired) {
    wired = true;
    const refresh = () => {
      cache = null;
      applyMotion();
      listeners.forEach((listener) => listener());
    };
    window.addEventListener("storage", (event) => {
      if (event.key === KEY || event.key === null) refresh();
    });
  }
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** The same decision as `currentMotion`, written out by hand so it can run before any other script. */
export const MOTION_SCRIPT = `(function(){var m=null;try{m=new URLSearchParams(location.search).get("${PARAM}")}catch(e){}if(m!=="full"&&m!=="reduced"){m=null;try{m=localStorage.getItem("${KEY}")}catch(e){}}if(m!=="full"&&m!=="reduced"){m="full"}document.documentElement.setAttribute("data-motion",m)})()`;
