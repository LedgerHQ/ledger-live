import { useCallback, useRef } from "react";

/**
 * Reads the next page once the end of the list scrolls into view, which is the web counterpart of
 * the native list's `onEndReached`.
 *
 * A callback ref rather than a plain one, and nothing else: React re-runs it with `null` and then
 * with the new node whenever its identity changes, and the view model hands back a fresh
 * `onLoadMore` every time a page settles. That is what re-arms the observer, and running it with
 * `null` on unmount is what disconnects it.
 */
export function useLoadMoreOnScroll(onLoadMore?: () => void) {
  const observer = useRef<IntersectionObserver | null>(null);

  return useCallback(
    (node: HTMLDivElement | null) => {
      observer.current?.disconnect();
      observer.current = null;

      if (!node || !onLoadMore || typeof IntersectionObserver === "undefined") {
        return;
      }

      observer.current = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          onLoadMore();
        }
      });

      observer.current.observe(node);
    },
    [onLoadMore],
  );
}
