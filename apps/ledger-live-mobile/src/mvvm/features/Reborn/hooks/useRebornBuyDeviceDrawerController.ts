import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";

import {
  closeRebornBuyDeviceDrawer,
  openRebornBuyDeviceDrawer,
  rebornBuyDeviceDrawerStateSelector,
} from "~/reducers/rebornBuyDeviceDrawer";
import { REBORN_BUY_DRAWER_ANALYTICS_PAGE } from "../consts/analytics";

/** A flow waiting for a device: Connect resumes it, any other exit cancels it. */
export type RebornBuyDeviceNext = { onConnect: () => void; onCancel?: () => void };

// Callbacks cannot live in Redux. Only one sheet is open at a time.
let pendingNext: RebornBuyDeviceNext | undefined;

/** Returns the waiting flow once, so it runs only once. */
export function takeRebornBuyDeviceNext() {
  const next = pendingNext;
  pendingNext = undefined;
  return next;
}
/**
 * Hook to manage the global state of the Reborn Buy Device Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the reborn buy device drawer
 * - Handle drawer state through Redux
 */
export const useRebornBuyDeviceDrawerController = () => {
  const dispatch = useDispatch();

  const { isOpen } = useSelector(rebornBuyDeviceDrawerStateSelector);

  const openDrawer = useCallback(
    (next?: RebornBuyDeviceNext) => {
      pendingNext = next;
      dispatch(openRebornBuyDeviceDrawer());
      track("drawer_opened", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    takeRebornBuyDeviceNext()?.onCancel?.();
    dispatch(closeRebornBuyDeviceDrawer());
    track("drawer_closed", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
  }, [dispatch]);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
  };
};
