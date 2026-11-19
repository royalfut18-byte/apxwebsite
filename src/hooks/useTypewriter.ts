import { useEffect, useState } from "react";

/**
 * Types `text` out one character at a time while `active`. Changing `runKey`
 * restarts it. When inactive it shows the whole string, so a paused or
 * reduced-motion demo still reads properly.
 */
export function useTypewriter(text: string, active: boolean, runKey: number | string, msPerChar = 38) {
  const [state, setState] = useState({ key: runKey, count: 0 });

  // Start again whenever the run changes (adjusting state during render, per the React docs).
  if (state.key !== runKey) setState({ key: runKey, count: 0 });

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setState((s) => (s.count >= text.length ? s : { ...s, count: s.count + 1 }));
    }, msPerChar);
    return () => window.clearInterval(id);
  }, [active, text, runKey, msPerChar]);

  return active ? text.slice(0, state.count) : text;
}
