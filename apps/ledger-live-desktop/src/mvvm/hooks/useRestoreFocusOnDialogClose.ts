import { useCallback, useRef } from "react";

/**
 * Focus is only ours to hand back when nothing else has claimed it: either it
 * sits nowhere, or on the overlay that is closing.
 */
function focusIsUnclaimed(closingOverlay: HTMLElement | null): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement === null ||
    activeElement === document.body ||
    Boolean(closingOverlay?.contains(activeElement))
  );
}

/**
 * An embedded live app cannot claim keyboard focus back on its own — only the
 * embedder can hand it over. Clicking inside a webview leaves the embedder's
 * active element on the body, so there is no origin element to restore and the
 * webview stays keyboard-dead after the dialog closes.
 */
function lastConnectedWebview(): HTMLElement | null {
  const webviews = document.querySelectorAll<HTMLElement>("webview");
  for (let index = webviews.length - 1; index >= 0; index--) {
    const webview = webviews[index];
    if (webview.isConnected) {
      return webview;
    }
  }
  return null;
}

export function useRestoreFocusOnDialogClose() {
  const focusOriginRef = useRef<HTMLElement | null>(null);

  const onOpenAutoFocus = useCallback(() => {
    const activeElement = document.activeElement;
    focusOriginRef.current =
      activeElement instanceof HTMLElement && activeElement !== document.body
        ? activeElement
        : null;
  }, []);

  const onCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    const closingOverlay = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;

    requestAnimationFrame(() => {
      const focusOrigin = focusOriginRef.current;
      focusOriginRef.current = null;

      if (document.activeElement === focusOrigin || !focusIsUnclaimed(closingOverlay)) {
        return;
      }

      const target = focusOrigin?.isConnected ? focusOrigin : lastConnectedWebview();
      target?.focus();
    });
  }, []);

  return { onOpenAutoFocus, onCloseAutoFocus };
}
