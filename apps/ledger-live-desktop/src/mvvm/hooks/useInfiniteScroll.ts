import { useLayoutEffect, useRef } from "react";

export function useInfiniteScroll(onLoadMore: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  onLoadMoreRef.current = onLoadMore;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onLoadMoreRef.current();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
