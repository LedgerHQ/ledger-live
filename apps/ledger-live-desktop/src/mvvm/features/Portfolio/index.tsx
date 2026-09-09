import React from "react";
import { AnalyticsConsentDialog } from "LLD/features/AnalyticsConsentDialog";
import { Q2TourDialog, useQ2TourDrawerViewModel } from "LLD/features/Q2Tour";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { LargeScreenUpsellModalMount } from "LLD/features/LargeScreenUpsell";
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

  const {
    isDialogOpen: isQ2TourOpen,
    closeDrawer: handleCloseQ2Tour,
    dismissDrawer: handleDismissQ2Tour,
    completeDrawer: handleCompleteQ2Tour,
    onSlideChange: onQ2TourSlideChange,
    onContinueClick: onQ2TourContinueClick,
  } = useQ2TourDrawerViewModel({ isOnPortfolioPage: true });

  return (
    <>
      <PortfolioView {...viewModel} />
      <LargeScreenUpsellModalMount />
      <AnalyticsConsentDialog />
      <Q2TourDialog
        isOpen={isQ2TourOpen}
        onHeaderClose={handleCloseQ2Tour}
        onDismiss={handleDismissQ2Tour}
        onContinueClick={onQ2TourContinueClick}
        onComplete={handleCompleteQ2Tour}
        onSlideChange={onQ2TourSlideChange}
      />
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
