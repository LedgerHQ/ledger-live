import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { setHasSeenWalletV4Tour } from "~/actions/settings";
import { hasSeenWalletV4TourSelector } from "~/reducers/settings";
import type { WalletV4TourDrawerViewModel } from "../types";

export const useWalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const lwmWallet40 = useFeature("lwmWallet40");
  const isTourEnabled = (lwmWallet40?.enabled && lwmWallet40?.params?.tour) ?? false;

  const [isDrawerOpen, setIsDrawerOpen] = useState(isTourEnabled && !hasSeenTour);

  const handleOpenDrawer = useCallback(() => {
    if (hasSeenTour) return;
    setIsDrawerOpen(true);
  }, [hasSeenTour]);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    if (!hasSeenTour) {
      dispatch(setHasSeenWalletV4Tour(true));
    }
  }, [dispatch, hasSeenTour]);

  return {
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
  };
};
