import { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";
import { track } from "~/renderer/analytics/segment";

export interface UseWalletV4TourDrawerViewModelOptions {
  /** When true and tour is enabled and not yet seen, the dialog will auto-open (e.g. on Portfolio page). */
  isOnPortfolioPage?: boolean;
}

export interface WalletV4TourDrawerViewModel {
  readonly isDialogOpen: boolean;
  readonly hasSeenTour: boolean;
  readonly handleOpenDialog: () => void;
  readonly handleCloseDialog: () => void;
}

export const useWalletV4TourDrawerViewModel = (
  options: UseWalletV4TourDrawerViewModelOptions = {},
): WalletV4TourDrawerViewModel => {
  const { isOnPortfolioPage = false } = options;
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const { shouldDisplayTour } = useWalletFeaturesConfig("desktop");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Auto-open only when: tour enabled, not seen yet, and user is on Portfolio page
  useEffect(() => {
    if (isOnPortfolioPage && shouldDisplayTour && !hasSeenTour) {
      setIsDialogOpen(true);
      track("Wallet V4 Tour Shown", { platform: "LWD", source: "portfolio" });
    }
  }, [isOnPortfolioPage, shouldDisplayTour, hasSeenTour]);

  const handleOpenDialog = useCallback(() => {
    if (!shouldDisplayTour || hasSeenTour) return;
    setIsDialogOpen(true);
  }, [shouldDisplayTour, hasSeenTour]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    dispatch(setHasSeenWalletV4Tour(true));
    track("Wallet V4 Tour Dismissed", { platform: "LWD", source: "portfolio" });
  }, [dispatch]);

  return {
    isDialogOpen,
    hasSeenTour,
    handleOpenDialog,
    handleCloseDialog,
  };
};
