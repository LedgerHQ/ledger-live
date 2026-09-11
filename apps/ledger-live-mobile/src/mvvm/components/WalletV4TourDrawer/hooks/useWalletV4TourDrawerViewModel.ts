import { useState, useCallback, useRef, useEffect } from "react";
import { track } from "~/analytics";
import type { WalletV4TourDrawerViewModel } from "../types";

type UseWalletV4TourDrawerViewModelParams = {
  readonly isTourEnabled: boolean;
  readonly hasSeenTour: boolean;
  readonly markTourAsSeen: () => void;
  readonly page: string;
};

export const useWalletV4TourDrawerViewModel = ({
  isTourEnabled,
  hasSeenTour,
  markTourAsSeen,
  page,
}: UseWalletV4TourDrawerViewModelParams): WalletV4TourDrawerViewModel => {
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);

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
      markTourAsSeen();
    }
  }, [markTourAsSeen, hasSeenTour]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) {
      return;
    }
    track("button_clicked", {
      button: "Close",
      page,
      card: currentIndexRef.current + 1,
    });
    handleCloseDrawer();
  }, [handleCloseDrawer, page]);

  const onSlideChange = useCallback(
    (index: number) => {
      currentIndexRef.current = index;
      track("product_tour_card", {
        page,
        card: index + 1,
      });
    },
    [page],
  );

  return {
    isDrawerOpen,
    handleOpenDrawer,
    handleCloseDrawer,
    closeDrawer,
    onSlideChange,
  };
};
