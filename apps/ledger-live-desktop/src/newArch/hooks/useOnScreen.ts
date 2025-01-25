import React, { useEffect } from "react";

interface InteractionObserverHookParams {
  root?: React.RefObject<Element>;
  target: React.RefObject<Element>;
  onIntersect: Function;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Observe if target is getting into viewport
 * (related to root. Root is document viewport if not given)
 **/
export function useOnScreen({
  root,
  target,
  onIntersect,
  threshold = 1.0,
  rootMargin = "0px",
  enabled = true,
}: InteractionObserverHookParams) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const el = target && target.current;

    if (!el) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => entry.isIntersecting && onIntersect()),
      {
        root: root?.current ?? null,
        rootMargin,
        threshold,
      },
    );

    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, [enabled, root, rootMargin, threshold, target, onIntersect]);
}
