import { useState, useCallback } from "react";
import { useSelector, useDispatch } from "LLD/hooks/redux";
import { hasSeenWalletV4TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";

export interface WalletV4TourDrawerViewModel {
  readonly isDialogOpen: boolean;
  readonly hasSeenTour: boolean;
  readonly handleOpenDialog: () => void;
  readonly handleCloseDialog: () => void;
}

export const useWalletV4TourDrawerViewModel = (): WalletV4TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenWalletV4TourSelector);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = useCallback(() => {
    if (hasSeenTour) return;
    setIsDialogOpen(true);
  }, [hasSeenTour]);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    dispatch(setHasSeenWalletV4Tour(true));
  }, [dispatch]);

  return {
    isDialogOpen,
    hasSeenTour,
    handleOpenDialog,
    handleCloseDialog,
  };
};
