import { useCallback, useLayoutEffect, useRef, useState } from "react";

const SCROLL_STEP = 300;
const SCROLL_END_THRESHOLD = 2;

export const useHorizontalScroll = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const atStart = container.scrollLeft <= SCROLL_END_THRESHOLD;
    const atEnd =
      container.scrollLeft + container.clientWidth >= container.scrollWidth - SCROLL_END_THRESHOLD;

    setIsAtStart(prev => (prev === atStart ? prev : atStart));
    setIsAtEnd(prev => (prev === atEnd ? prev : atEnd));
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(container);
    if (container.firstElementChild) {
      resizeObserver.observe(container.firstElementChild);
    }

    updateScrollState();

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  const scrollLeft = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: -SCROLL_STEP, behavior: "smooth" });
  }, []);

  const scrollRight = useCallback(() => {
    scrollContainerRef.current?.scrollBy({ left: SCROLL_STEP, behavior: "smooth" });
  }, []);

  return { scrollContainerRef, isAtStart, isAtEnd, scrollLeft, scrollRight };
};
