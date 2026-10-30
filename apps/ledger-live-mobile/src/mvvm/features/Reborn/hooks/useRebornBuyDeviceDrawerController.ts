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
  ConnectDeviceRequestContext,
  type ConnectDeviceRequest,
} from "../drawers/ConnectDeviceRequestProvider";
/**
 * Hook to manage the global state of the Reborn Buy Device Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the reborn buy device drawer
 * - Handle drawer state through Redux
 * - Answer the flow that asked for a device (`ConnectDeviceRequestProvider`)
 */
export const useRebornBuyDeviceDrawerController = () => {
  const dispatch = useDispatch();
  const requestState = useContext(ConnectDeviceRequestContext);

  const { isOpen } = useSelector(rebornBuyDeviceDrawerStateSelector);

  const openDrawer = useCallback(
    (request?: ConnectDeviceRequest) => {
      requestState?.setRequest(request);
      dispatch(openRebornBuyDeviceDrawer());
      track("drawer_opened", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
    },
    [requestState, dispatch],
  );

  const closeDrawer = useCallback(
    (reason?: "connect") => {
      if (reason === "connect") requestState?.request?.onConnect();
      else requestState?.request?.onDismiss?.();
      requestState?.setRequest(undefined);
      dispatch(closeRebornBuyDeviceDrawer());
      track("drawer_closed", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
    },
    [requestState, dispatch],
  );

  return {
    isOpen,
    openDrawer,
    closeDrawer,
  };
};
