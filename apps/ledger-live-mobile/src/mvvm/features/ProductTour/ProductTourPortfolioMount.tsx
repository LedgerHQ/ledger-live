import React from "react";
import { ProductTourControlsProvider } from "./context/ProductTourControlsContext";
import { ProductTourDrawer, useProductTourDrawerViewModel } from "./Drawer";
import { useProductTourEligibility } from "./useProductTourEligibility";

const ProductTourPortfolioMountWhenEnabled = () => {
  const { openProductTour, closeProductTour, isDrawerOpen } = useProductTourDrawerViewModel();

  return (
    <ProductTourControlsProvider
      value={{
        openProductTour,
        closeProductTour,
      }}
    >
      <ProductTourDrawer isDrawerOpen={isDrawerOpen} />
    </ProductTourControlsProvider>
  );
};

export const ProductTourPortfolioMount = () => {
  const { isProductTourEligible } = useProductTourEligibility();

  if (!isProductTourEligible) {
    return null;
  }

  return <ProductTourPortfolioMountWhenEnabled />;
};
