import { useCallback } from "react";
import { track } from "~/analytics";
import { useSelector, useDispatch } from "~/context/hooks";

import {
  closeRebornBuyDeviceDrawer,
  openRebornBuyDeviceDrawer,
  rebornBuyDeviceDrawerStateSelector,
} from "~/reducers/rebornBuyDeviceDrawer";
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
      track("drawer_opened", { page: "UpsellFlex", flow: "reborn" });
    },
    [dispatch],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeRebornBuyDeviceDrawer());
    track("drawer_closed", { page: "UpsellFlex", flow: "reborn" });
  }, [dispatch]);

  return {
    isOpen,
    sourceScreenName,
    openDrawer,
    closeDrawer,
  };
};
