import { useEffect, useRef, useState } from "react";

export const PLACEHOLDER_INTERVAL_MS = 7000;

function usePrefersReducedMotion(): boolean {
  const queryRef = useRef<MediaQueryList | null>(null);
  if (queryRef.current === null) {
    queryRef.current = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
  }
  const [reduced, setReduced] = useState(() => queryRef.current?.matches ?? false);

  useEffect(() => {
    const query = queryRef.current;
    if (!query) return;
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function useCyclingPlaceholder(length: number, enabled: boolean) {
  const reduceMotion = usePrefersReducedMotion();
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
