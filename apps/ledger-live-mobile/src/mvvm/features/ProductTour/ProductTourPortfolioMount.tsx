import React from "react";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { ProductTourControlsProvider } from "./context/ProductTourControlsContext";
import { ProductTourDrawer, useProductTourDrawerViewModel } from "./Drawer";

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

/**
 * Portfolio integration: mounts Product Tour controls + drawer when `lwmProductTour` is on.
 */
export const ProductTourPortfolioMount = () => {
  const lwmProductTour = useFeature("lwmProductTour");
  const isEnabled = lwmProductTour?.enabled ?? false;

  if (!isEnabled) {
    return null;
  }

  return <ProductTourPortfolioMountWhenEnabled />;
};
