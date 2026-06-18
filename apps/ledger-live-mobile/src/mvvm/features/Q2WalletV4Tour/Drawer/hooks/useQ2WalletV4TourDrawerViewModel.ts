import { useState, useCallback, useRef, useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";
import { hasSeenQ2WalletV4TourSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { PAGE_TRACKING_Q2_WALLET_V4_TOUR } from "../const";
import type { Q2WalletV4TourDrawerViewModel } from "../types";

export const useQ2WalletV4TourDrawerViewModel = (): Q2WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const hasSeenTour = useSelector(hasSeenQ2WalletV4TourSelector);
  const lwmWallet40 = useFeature("lwmWallet40");
  const isTourEnabled = (lwmWallet40?.enabled && lwmWallet40?.params?.q2Tour) ?? false;

  const [isDrawerOpen, setIsDrawerOpen] = useState(isTourEnabled && !hasSeenTour);

  const handleOpenDrawer = useCallback(() => {
    if (isTourEnabled && !hasSeenTour) {
      isClosingRef.current = false;
      currentIndexRef.current = 0;
      setIsDrawerOpen(true);
    }
  }, [isTourEnabled, hasSeenTour]);

  useEffect(() => {
    if (!hasAutoOpenedRef.current && isTourEnabled && !hasSeenTour) {
      hasAutoOpenedRef.current = true;
      handleOpenDrawer();
    }
  }, [isTourEnabled, hasSeenTour, handleOpenDrawer]);

  const handleCloseDrawer = useCallback(() => {
    isClosingRef.current = true;
    setIsDrawerOpen(false);
    if (!hasSeenTour) {
      dispatch(setHasSeenQ2WalletV4Tour(true));
    }
  }, [dispatch, hasSeenTour]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const onSlideChange = useCallback((index: number) => {
    currentIndexRef.current = index;
    track("product_tour_card", {
      page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
      card: index + 1,
    });
  }, []);

  return {
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
    closeDrawer,
    onSlideChange,
  };
};
