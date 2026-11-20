/**
 * Scrolls to a section (a CSS selector) or to a pixel offset, using the browser's own
 * smooth scrolling. Visitors who ask for reduced motion jump straight there.
 */
export function scrollToTarget(target: string | number) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
  }
}
