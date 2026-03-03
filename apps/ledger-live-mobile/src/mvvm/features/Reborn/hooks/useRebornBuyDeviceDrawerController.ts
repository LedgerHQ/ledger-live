import { useCallback } from "react";
import { track } from "~/analytics";
import { useSelector, useDispatch } from "~/context/hooks";

import {
  closeRebornBuyDeviceDrawer,
  openRebornBuyDeviceDrawer,
  rebornBuyDeviceDrawerStateSelector,
} from "~/reducers/rebornBuyDeviceDrawer";
import { REBORN_BUY_DRAWER_ANALYTICS_PAGE } from "../consts/analytics";
/**
 * Hook to manage the global state of the Reborn Buy Device Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the reborn buy device drawer
 * - Handle drawer state through Redux
 */
export const useRebornBuyDeviceDrawerController = () => {
  const dispatch = useDispatch();

  const { isOpen, sourceScreenName } = useSelector(rebornBuyDeviceDrawerStateSelector);

  const openDrawer = useCallback(
    (params?: { sourceScreenName: string }) => {
      dispatch(
        openRebornBuyDeviceDrawer({
          sourceScreenName: params?.sourceScreenName ?? "",
        }),
      );
      track("drawer_opened", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeRebornBuyDeviceDrawer());
    track("drawer_closed", { page: REBORN_BUY_DRAWER_ANALYTICS_PAGE, flow: "reborn" });
  }, [dispatch]);

  return {
    isOpen,
    sourceScreenName,
    openDrawer,
    closeDrawer,
  };
};
