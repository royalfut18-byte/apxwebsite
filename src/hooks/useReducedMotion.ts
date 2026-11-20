import { useSyncExternalStore } from "react";

import { currentMotion, subscribeMotion } from "@/lib/motion";

const onServer = () => false;
const onClient = () => currentMotion() === "reduced";

/**
 * True when the site should hold still: the visitor's device asks for reduced motion, or
 * they switched the animations off here (see lib/motion.ts). False on the server.
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeMotion, onClient, onServer);
}
