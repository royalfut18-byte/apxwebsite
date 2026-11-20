"use client";

import { motion } from "framer-motion";

import { cn, ease } from "@/lib/cn";

/** The short rule in a section's label. It draws itself out from the left on arrival. */
export function Rule({ className }: { className?: string }) {
  return (
    <motion.span
      data-reveal=""
      aria-hidden="true"
      className={cn("block h-px w-8 origin-left", className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.9, ease: ease.expo, delay: 0.35 }}
    />
  );
}
