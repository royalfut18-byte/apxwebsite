import { useEffect, useState } from "react";

/**
 * Steps through a fixed list of durations, looping forever while `active`.
 * Returns the current step index. `durations` must be a stable reference.
 */
export function useSequence(durations: readonly number[], active: boolean, initial = 0) {
  const [step, setStep] = useState(initial);

  useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => {
      setStep((s) => (s + 1) % durations.length);
    }, durations[step]);
    return () => window.clearTimeout(id);
  }, [active, step, durations]);

  return step;
}
