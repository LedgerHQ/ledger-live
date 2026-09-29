import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "LLD/utils/cn";
import {
  isAnimatedHeightCapped,
  measureStackedHeight,
  readAvailableHeight,
  resolveAnimatedHeight,
} from "./animatedHeightLayout";

const AnimatedHeightCappedContext = createContext(false);

export function useAnimatedHeightCapped(): boolean {
  return useContext(AnimatedHeightCappedContext);
}

type AnimatedHeightProps = Readonly<{
  header: ReactNode;
  children: ReactNode;
  /** Transition duration in ms. Defaults to 300. */
  duration?: number;
}>;

/**
 * Animates dialog height to fit the content, and stops at the dialog max height
 * so the body can scroll instead of being clipped.
 */
export function AnimatedHeight({ header, children, duration = 300 }: AnimatedHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef<number | undefined>(undefined);
  const cappedRef = useRef(false);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [isCapped, setIsCapped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const syncHeight = useCallback(() => {
    const outer = outerRef.current;
    const content = contentRef.current;
    if (!outer || !content) return;

    const natural = measureStackedHeight(content);
    if (natural <= 0) return;

    const available = readAvailableHeight(outer);
    const next = resolveAnimatedHeight(natural, available);
    const capped = isAnimatedHeightCapped(natural, available);

    if (cappedRef.current !== capped) {
      cappedRef.current = capped;
      setIsCapped(capped);
    }

    const current = heightRef.current;
    if (current !== undefined && Math.abs(current - next) <= 0.5) return;

    if (current !== undefined) setIsAnimating(true);
    heightRef.current = next;
    setHeight(next);
  }, []);

  const handleTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== outerRef.current) return;
    if (event.propertyName !== "height") return;
    setIsAnimating(false);
  }, []);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    syncHeight();

    const observer = new ResizeObserver(syncHeight);
    const observeTree = (element: HTMLElement) => {
      observer.observe(element);
      for (const child of element.children) {
        if (child instanceof HTMLElement) observeTree(child);
      }
    };
    observeTree(content);

    const mutations = new MutationObserver(() => {
      observeTree(content);
      syncHeight();
    });
    mutations.observe(content, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [syncHeight]);

  return (
    <AnimatedHeightCappedContext.Provider value={isCapped}>
      <div
        ref={outerRef}
        onTransitionEnd={handleTransitionEnd}
        className="flex w-full min-h-0 flex-col"
        style={{
          height: height === undefined ? undefined : `${height}px`,
          overflow: isCapped || isAnimating ? "hidden" : "visible",
          transition: `height ${duration}ms ease`,
        }}
      >
        <div ref={contentRef} className={cn("flex w-full min-h-0 flex-col", isCapped && "h-full")}>
          <div className="shrink-0">{header}</div>
          {children}
        </div>
      </div>
    </AnimatedHeightCappedContext.Provider>
  );
}
