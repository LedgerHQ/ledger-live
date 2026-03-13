import React, { useRef, useEffect, useCallback, type ReactNode } from "react";

type AnimatedHeightProps = Readonly<{
  children: ReactNode;
  /** Transition duration in ms. Defaults to 300. */
  duration?: number;
}>;

/**
 * Wrapper whose height smoothly transitions when the content size changes
 */
export function AnimatedHeight({ children, duration = 300 }: AnimatedHeightProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const handleTransitionEnd = useCallback((event: React.TransitionEvent<HTMLDivElement>) => {
    const outer = outerRef.current;
    if (!outer) return;
    // Only react to the height transition on the outer element itself
    if (event.target !== outer) return;
    if (event.propertyName !== "height") return;
    outer.style.overflow = "visible";
  }, []);

  useEffect(() => {
    const inner = innerRef.current;
    const outer = outerRef.current;
    if (!inner || !outer) return;

    outer.style.height = `${inner.offsetHeight}px`;

    const observer = new ResizeObserver(() => {
      if (!inner || !outer) return;
      const newHeight = inner.offsetHeight;
      const currentHeight = Number.parseFloat(outer.style.height) || 0;

      if (Math.abs(newHeight - currentHeight) > 0.5) {
        outer.style.overflow = "hidden";
        outer.style.height = `${newHeight}px`;
      }
    });

    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={outerRef}
      onTransitionEnd={handleTransitionEnd}
      style={{ overflow: "visible", transition: `height ${duration}ms ease` }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}
