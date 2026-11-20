import { currentMotion } from "./motion";

/**
 * Scrolls to a section (a CSS selector) or to a pixel offset, using the browser's own
 * smooth scrolling. Visitors who ask for reduced motion jump straight there.
 */
export function scrollToTarget(target: string | number) {
  const behavior: ScrollBehavior = currentMotion() === "reduced" ? "auto" : "smooth";
  if (typeof target === "number") {
    window.scrollTo({ top: target, behavior });
  } else {
    document.querySelector(target)?.scrollIntoView({ behavior, block: "start" });
  }
}

/**
 * Scrolls to one project in the portfolio. On wide screens the project cards are stacked
 * and pinned, so a card's place on the page is worked out from its position in the stack
 * rather than from where it currently appears.
 */
export function scrollToProject(slug: string) {
  const card = document.querySelector<HTMLElement>(`[data-project="${slug}"]`);
  const stack = card?.parentElement;
  if (!card || !stack) return scrollToTarget("#work");
  const index = Array.prototype.indexOf.call(stack.children, card);
  const pinned = getComputedStyle(card).position === "sticky";
  const top = pinned
    ? stack.getBoundingClientRect().top + window.scrollY + index * card.offsetHeight
    : card.getBoundingClientRect().top + window.scrollY - 72;
  scrollToTarget(Math.max(0, Math.round(top)));
}
