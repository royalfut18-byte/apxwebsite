import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False on the server and during hydration, true afterwards. */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
