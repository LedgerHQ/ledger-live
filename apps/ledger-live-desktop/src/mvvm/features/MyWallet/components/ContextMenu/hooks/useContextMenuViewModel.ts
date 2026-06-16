import { useCallback, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import type { ContextMenuViewProps } from "../types";
import { MY_WALLET_TRACKING_BUTTON } from "../../../constants";
import { useContextMenuNavigation } from "./useContextMenuNavigation";

export function useContextMenuViewModel(): ContextMenuViewProps {
  const [open, setOpen] = useState(false);
  const { view, direction, navigateTo, goBack, reset } = useContextMenuNavigation();
  const location = useLocation();

  const close = useCallback(() => setOpen(false), []);

  const contextValue = useMemo(
    () => ({ close, view, direction, navigateTo, goBack }),
    [close, view, direction, navigateTo, goBack],
  );

  const onOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        reset();
        track("button_clicked", {
          button: MY_WALLET_TRACKING_BUTTON.menu,
          page: currentRouteNameRef.current ?? location.pathname,
        });
      }
    },
    [location.pathname, reset],
  );

  return {
    open,
    onOpenChange,
    contextValue,
  };
}
