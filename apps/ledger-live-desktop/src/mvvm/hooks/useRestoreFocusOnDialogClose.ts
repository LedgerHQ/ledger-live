import { useCallback, useRef } from "react";

function canRestoreFocus(
  origin: HTMLElement | null,
  closingOverlay: HTMLElement | null,
): origin is HTMLElement {
  if (!origin?.isConnected) {
    return false;
  }

  const activeElement = document.activeElement;
  return (
    activeElement === document.body ||
    activeElement === origin ||
    Boolean(closingOverlay?.contains(activeElement))
  );
}

export function useRestoreFocusOnDialogClose() {
  const focusOriginRef = useRef<HTMLElement | null>(null);

  const onOpenAutoFocus = useCallback(() => {
    const activeElement = document.activeElement;
    focusOriginRef.current = activeElement instanceof HTMLElement ? activeElement : null;
  }, []);

  const onCloseAutoFocus = useCallback((event: Event) => {
    event.preventDefault();
    const closingOverlay = event.currentTarget instanceof HTMLElement ? event.currentTarget : null;

    requestAnimationFrame(() => {
      const focusOrigin = focusOriginRef.current;
      focusOriginRef.current = null;

      if (canRestoreFocus(focusOrigin, closingOverlay)) {
        focusOrigin.focus();
      }
    });
  }, []);

  return { onOpenAutoFocus, onCloseAutoFocus };
}
