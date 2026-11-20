"use client";

import { motion, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";

/** A hairline along the top of the screen that fills as the home page is read. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  // (Elsewhere there is nothing to scroll, and a page with nothing to scroll counts as read.)
  if (usePathname() !== "/") return null;
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[62] h-[2px] origin-left bg-[linear-gradient(to_right,var(--color-violet),var(--color-rose)_45%,var(--color-ember))]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
