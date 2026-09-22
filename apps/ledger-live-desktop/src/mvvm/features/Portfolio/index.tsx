import React from "react";
import { useFeature } from "@features/platform-feature-flags";
import { AnalyticsConsentDialog } from "LLD/features/AnalyticsConsentDialog";
import { ProductTourDialog, useProductTourDialogViewModel } from "LLD/features/ProductTour/Drawer";
import { Q2TourDialog, useQ2TourDrawerViewModel } from "LLD/features/Q2Tour";
import { Q3TourDialog, useQ3TourDrawerViewModel } from "LLD/features/Q3Tour";
import { LargeScreenUpsellModalMount } from "LLD/features/LargeScreenUpsell";
import { usePortfolioViewModel } from "./hooks/usePortfolioViewModel";
import { PortfolioView } from "./PortfolioView";

const Portfolio = () => {
  const viewModel = usePortfolioViewModel();
  const lwdProductTour = useFeature("lwdProductTour");
  const {
    isDialogOpen: isQ2TourOpen,
    closeDrawer: handleCloseQ2Tour,
    dismissDrawer: handleDismissQ2Tour,
    completeDrawer: handleCompleteQ2Tour,
    onSlideChange: onQ2TourSlideChange,
    onContinueClick: onQ2TourContinueClick,
  } = useQ2TourDrawerViewModel({ isOnPortfolioPage: true });
  const {
    tour: q3Tour,
    isDialogOpen: isQ3TourOpen,
    closeDrawer: handleCloseQ3Tour,
    dismissDrawer: handleDismissQ3Tour,
    completeDrawer: handleCompleteQ3Tour,
    onSlideChange: onQ3TourSlideChange,
    onContinueClick: onQ3TourContinueClick,
  } = useQ3TourDrawerViewModel({ isOnPortfolioPage: true });
  const productTourDialogViewModel = useProductTourDialogViewModel();

  return (
    <>
      <PortfolioView {...viewModel} />
      <LargeScreenUpsellModalMount />
      <AnalyticsConsentDialog />
      {lwdProductTour?.enabled ? <ProductTourDialog {...productTourDialogViewModel} /> : null}
      <Q2TourDialog
        isOpen={isQ2TourOpen}
        onHeaderClose={handleCloseQ2Tour}
        onDismiss={handleDismissQ2Tour}
        onContinueClick={onQ2TourContinueClick}
        onComplete={handleCompleteQ2Tour}
        onSlideChange={onQ2TourSlideChange}
      />
      <Q3TourDialog
        tour={q3Tour}
        isOpen={isQ3TourOpen}
        onHeaderClose={handleCloseQ3Tour}
        onDismiss={handleDismissQ3Tour}
        onContinueClick={onQ3TourContinueClick}
        onComplete={handleCompleteQ3Tour}
        onSlideChange={onQ3TourSlideChange}
      />
    </>
  );
};

export default Portfolio;
