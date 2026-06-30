import { useEffect, useState } from "react";
import { useReducedMotion } from "react-native-reanimated";

export const PLACEHOLDER_INTERVAL_MS = 4000;

/**
 * Cycles through the placeholder phrases, advancing to the next one every
 * {@link PLACEHOLDER_INTERVAL_MS}. The slide transition itself is declared by
 * the consuming component via Reanimated entering/exiting keyframes.
 * Cycling pauses while `enabled` is false (e.g. the field has a value), and
 * stays on the first phrase when reduce-motion is enabled.
 */
export function useCyclingPlaceholder(length: number, enabled: boolean) {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  const animate = !reduceMotion && length > 1;

  useEffect(() => {
    if (!animate || !enabled) return;

    const id = setInterval(() => {
      setIndex(current => (current + 1) % length);
    }, PLACEHOLDER_INTERVAL_MS);

    return () => clearInterval(id);
  }, [animate, enabled, length]);

  return { index, animate };
}
