import { useState, useCallback, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";
import { track, trackPage } from "~/renderer/analytics/segment";
import { PAGE_TRACKING_WALLET_V4_TOUR } from "../const";

export interface UseWalletV4TourDrawerViewModelOptions {
  /** When true and tour is enabled and not yet seen, the dialog will auto-open (e.g. on Portfolio page). */
  isOnPortfolioPage?: boolean;
}

export interface WalletV4TourDrawerViewModel {
  readonly isDialogOpen: boolean;
  readonly hasSeenTour: boolean;
  readonly handleOpenDialog: () => void;
  readonly handleCloseDialog: () => void;
  readonly closeDrawer: () => void;
  readonly completeDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
}

export const useWalletV4TourDrawerViewModel = (
  options: UseWalletV4TourDrawerViewModelOptions = {},
): WalletV4TourDrawerViewModel => {
  const { isOnPortfolioPage = false } = options;
  const dispatch = useDispatch();
  const currentIndexRef = useRef(0);
  const isClosingRef = useRef(false);
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const { shouldDisplayTour } = useWalletFeaturesConfig("desktop");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    dispatch(setHasSeenWalletV4Tour(true));
  }, [dispatch]);

  const closeDrawer = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    track("button_clicked", {
      button: "Close",
      page: PAGE_TRACKING_WALLET_V4_TOUR,
      card: currentIndexRef.current + 1,
    });
    handleCloseDialog();
  }, [handleCloseDialog]);

  const completeDrawer = useCallback(() => {
    isClosingRef.current = true;
    handleCloseDialog();
  }, [handleCloseDialog]);

  const onSlideChange = useCallback((index: number) => {
    currentIndexRef.current = index;
    track("product_tour_card", {
      page: PAGE_TRACKING_WALLET_V4_TOUR,
      card: index + 1,
    });
  }, []);

  const openDrawerWithTracking = useCallback((source: "portfolio" | "debug") => {
    isClosingRef.current = false;
    setIsDialogOpen(true);
    trackPage(
      PAGE_TRACKING_WALLET_V4_TOUR,
      undefined,
      { source: source === "portfolio" ? "Portfolio" : "Debug" },
      true,
      false,
    );
  }, []);

  useEffect(() => {
    if (isOnPortfolioPage && shouldDisplayTour && !hasSeenTour) {
      openDrawerWithTracking("portfolio");
    }
  }, [isOnPortfolioPage, shouldDisplayTour, hasSeenTour, openDrawerWithTracking]);

  const handleOpenDialog = useCallback(() => {
    if (!shouldDisplayTour || hasSeenTour) return;
    openDrawerWithTracking("debug");
  }, [shouldDisplayTour, hasSeenTour, openDrawerWithTracking]);

  return {
    isDialogOpen,
    hasSeenTour,
    handleOpenDialog,
    handleCloseDialog,
    closeDrawer,
    completeDrawer,
    onSlideChange,
  };
};
