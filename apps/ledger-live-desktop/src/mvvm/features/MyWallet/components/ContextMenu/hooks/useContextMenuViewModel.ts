import { useCallback, useMemo, useState } from "react";
import { track } from "~/renderer/analytics/segment";
import type { ContextMenuViewProps } from "../types";
import { MY_WALLET_TRACKING_BUTTON } from "../../../constants";
import { currentRouteNameRef } from "~/renderer/analytics/screenRefs";
import { useLocation } from "react-router";

export function useContextMenuViewModel(): ContextMenuViewProps {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const close = useCallback(() => setOpen(false), []);
  const contextValue = useMemo(() => ({ close }), [close]);
  const onOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      track("button_clicked", {
        button: MY_WALLET_TRACKING_BUTTON.menu,
        page: currentRouteNameRef.current ?? location.pathname,
      });
    }
  };

  return {
    open,
    onOpenChange,
    contextValue,
  };
}
