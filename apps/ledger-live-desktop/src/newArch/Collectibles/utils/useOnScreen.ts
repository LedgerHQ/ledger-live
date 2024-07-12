import React, { useState, useEffect, useCallback } from "react";

interface InteractionObserverHookParams {
  root?: React.RefObject<Element>;
  targets: React.RefObject<Element>[];
  onIntersect: () => void;
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useOnScreen({
  root,
  targets,
  onIntersect,
  threshold = 1.0,
  rootMargin = "20px",
  enabled = true,
}: InteractionObserverHookParams): boolean[] {
  const [isIntersecting, setIsIntersecting] = useState<boolean[]>(targets.map(() => false));
  const stableOnIntersect = useCallback(onIntersect, [onIntersect]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach((entry, index) => {
          const newState = [...isIntersecting];
          if (entry.isIntersecting) {
            stableOnIntersect();
            newState[index] = true;
          } else {
            newState[index] = false;
          }
          setIsIntersecting(newState);
        });
      },
      {
        root: root?.current ?? null,
        rootMargin,
        threshold,
      },
    );

    targets.forEach(target => {
      const element = target.current;
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      targets.forEach(target => {
        const element = target.current;
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [enabled, root, rootMargin, threshold, targets, stableOnIntersect, isIntersecting]);

  return isIntersecting;
}
