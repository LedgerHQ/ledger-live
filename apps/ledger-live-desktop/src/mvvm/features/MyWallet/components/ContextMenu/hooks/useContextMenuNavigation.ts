import { useCallback, useMemo, useState } from "react";
import { CONTEXT_MENU_VIEW } from "../types";
import type { ContextMenuNavigation, ContextMenuView, NavDirection } from "../types";

export function useContextMenuNavigation(): ContextMenuNavigation {
  const [view, setView] = useState<ContextMenuView>(CONTEXT_MENU_VIEW.myWallet);
  const [direction, setDirection] = useState<NavDirection>("forward");

  const navigateTo = useCallback((next: ContextMenuView) => {
    setDirection("forward");
    setView(next);
  }, []);

  const goBack = useCallback(() => {
    setDirection("back");
    setView(CONTEXT_MENU_VIEW.myWallet);
  }, []);

  const reset = useCallback(() => {
    setDirection("forward");
    setView(CONTEXT_MENU_VIEW.myWallet);
  }, []);

  return useMemo(
    () => ({ view, direction, navigateTo, goBack, reset }),
    [view, direction, navigateTo, goBack, reset],
  );
}
