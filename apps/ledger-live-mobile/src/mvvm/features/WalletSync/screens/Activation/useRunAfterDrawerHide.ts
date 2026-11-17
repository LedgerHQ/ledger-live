import { useCallback, useRef } from "react";

export type RunAfterDrawerHide = Readonly<{
  /** Keeps `action` until the drawer's `onModalHide`; a later call replaces it. */
  runAfterHide: (action: () => void) => void;
  /** Pass as the drawer's `onModalHide`: runs the kept action once, if any. */
  onModalHide: () => void;
}>;

/**
 * On Android, a sheet opened while a native modal drawer is still closing ignores its first tap,
 * so a drawer handing off to a device step starts it only once the drawer is gone.
 */
export function useRunAfterDrawerHide(): RunAfterDrawerHide {
  const pendingActionRef = useRef<(() => void) | null>(null);

  const runAfterHide = useCallback((action: () => void) => {
    pendingActionRef.current = action;
  }, []);

  const onModalHide = useCallback(() => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  }, []);

  return { runAfterHide, onModalHide };
}
