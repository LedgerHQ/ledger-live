import React from "react";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { usePortfolioViewModel } from "./hooks/usePortfolioViewModel";
import { PortfolioView } from "./PortfolioView";

const Portfolio = () => {
  const viewModel = usePortfolioViewModel();
  const {
    isDialogOpen: isWalletV4TourOpen,
    closeDrawer: handleCloseWalletV4Tour,
    completeDrawer: handleCompleteWalletV4Tour,
    onSlideChange: onWalletV4TourSlideChange,
  } = useWalletV4TourDrawerViewModel({ isOnPortfolioPage: true });

  return (
    <>
      <PortfolioView {...viewModel} />
      <WalletV4TourDialog
        isOpen={isWalletV4TourOpen}
        onClose={handleCloseWalletV4Tour}
        onComplete={handleCompleteWalletV4Tour}
        onSlideChange={onWalletV4TourSlideChange}
      />
    </>
  );
};

export default Portfolio;
