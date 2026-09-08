import { useState, useCallback, useRef, useEffect } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { PAGE_TRACKING_Q3_WALLET_V4_TOUR } from "../const";
import type { Q3WalletV4TourDrawerViewModel } from "../types";

export const useQ3WalletV4TourDrawerViewModel = (): Q3WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const hasSeenTour = useSelector(hasSeenQ3WalletV4TourSelector);
  const releaseTour = useFeature("releaseTour");
  const isTourEnabled = releaseTour?.enabled === true && releaseTour.params?.variant === "q3_a";

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
      dispatch(setHasSeenQ3WalletV4Tour(true));
    }
  }, [dispatch, hasSeenTour]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_Q3_WALLET_V4_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer]);

  const onSlideChange = useCallback((index: number) => {
    currentIndexRef.current = index;
    track("product_tour_card", {
      page: PAGE_TRACKING_Q3_WALLET_V4_TOUR,
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
