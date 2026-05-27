import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { AnalyticsConsentDialog } from "LLD/features/AnalyticsConsentDialog";
import { ProductTourDialog, useProductTourDialogViewModel } from "LLD/features/ProductTour/Drawer";
import {
  useWalletV4TourDrawerViewModel,
  WalletV4TourDialog,
} from "LLD/features/WalletV4Tour/Drawer";
import { usePortfolioViewModel } from "./hooks/usePortfolioViewModel";
import { PortfolioView } from "./PortfolioView";

const Portfolio = () => {
  const viewModel = usePortfolioViewModel();
  const lwdProductTour = useFeature("lwdProductTour");
  const {
    isDialogOpen: isWalletV4TourOpen,
    closeDrawer: handleCloseWalletV4Tour,
    completeDrawer: handleCompleteWalletV4Tour,
    onSlideChange: onWalletV4TourSlideChange,
  } = useWalletV4TourDrawerViewModel({ isOnPortfolioPage: true });
  const productTourDialogViewModel = useProductTourDialogViewModel();

  return (
    <>
      <PortfolioView {...viewModel} />
      <AnalyticsConsentDialog />
      {lwdProductTour?.enabled ? <ProductTourDialog {...productTourDialogViewModel} /> : null}
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
