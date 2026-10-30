import { track } from "@shared/analytics";
import { useCallback, useContext } from "react";
import { useSelector, useDispatch } from "~/context/hooks";

import {
  closeRebornBuyDeviceDrawer,
  openRebornBuyDeviceDrawer,
  rebornBuyDeviceDrawerStateSelector,
} from "~/reducers/rebornBuyDeviceDrawer";
import { REBORN_BUY_DRAWER_ANALYTICS_PAGE } from "../consts/analytics";
import {
  RebornBuyDeviceNextContext,
  type RebornBuyDeviceNext,
} from "../drawers/RebornBuyDeviceProvider";
/**
 * Hook to manage the global state of the Reborn Buy Device Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the reborn buy device drawer
 * - Handle drawer state through Redux
 * - Resume or cancel the flow that opened it (`RebornBuyDeviceProvider`)
 */
export const useRebornBuyDeviceDrawerController = () => {
  const dispatch = useDispatch();
  const nextState = useContext(RebornBuyDeviceNextContext);

  const { isOpen } = useSelector(rebornBuyDeviceDrawerStateSelector);

  const openDrawer = useCallback(
    (next?: RebornBuyDeviceNext) => {
      nextState?.setNext(next);
      dispatch(openRebornBuyDeviceDrawer());
      track("drawer_opened", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
    },
    [nextState, dispatch],
  );

  const hide = useCallback(() => {
    nextState?.setNext(undefined);
    dispatch(closeRebornBuyDeviceDrawer());
    track("drawer_closed", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
  }, [nextState, dispatch]);

  const closeDrawer = useCallback(() => {
    nextState?.next?.onCancel?.();
    hide();
  }, [nextState, hide]);

  /** Connect resumes the waiting flow instead of cancelling it. */
  const connect = useCallback(() => {
    nextState?.next?.onConnect();
    hide();
  }, [nextState, hide]);

  return {
    isOpen,
    openDrawer,
    closeDrawer,
    connect,
  };
};
