import { useCallback, useRef } from "react";

type WebviewElement = HTMLElement & { getWebContentsId?: () => number };

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
 * An embedded live app cannot claim keyboard focus back on its own, and a click
 * inside a guest leaves the embedder's active element on the body — so there is
 * no origin element to restore and the webview stays keyboard-dead.
 *
 * The guest to hand focus to is the topmost one that outlives the closing
 * dialog: a webview rendered inside that dialog dies with it, and focusing a
 * guest whose webContents is already gone crashes (see LiveAppDrawer).
 * `getWebContentsId` throws while the guest is detached, so it doubles as the
 * liveness probe.
 */
function topmostLiveWebview(closingOverlay: HTMLElement | null): HTMLElement | null {
  const webviews = document.querySelectorAll<WebviewElement>("webview");

  for (let index = webviews.length - 1; index >= 0; index--) {
    const webview = webviews[index];
    if (!webview.isConnected || closingOverlay?.contains(webview)) {
      continue;
    }

    try {
      webview.getWebContentsId?.();
    } catch {
      continue;
    }

    return webview;
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

      const target = focusOrigin?.isConnected ? focusOrigin : topmostLiveWebview(closingOverlay);
      target?.focus();
    });
  }, []);

  return { onOpenAutoFocus, onCloseAutoFocus };
}
