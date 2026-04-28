import React from "react";
import { View } from "react-native";
import { ProductTourControlsProvider } from "../../context/ProductTourControlsContext";
import { ProductTourDrawer } from "../../Drawer";
import type { UseProductTourPortfolioMountViewModelResult } from "./useProductTourPortfolioMountViewModel";

export const ProductTourPortfolioMountView = ({
  isProductTourEligible,
  openProductTour,
  closeProductTour,
  onSlideChange,
  isDrawerOpen,
}: UseProductTourPortfolioMountViewModelResult) => {
  if (!isProductTourEligible) {
    return null;
  }

  return (
    <View testID="product-tour-portfolio-mount" collapsable={false}>
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onSlideChange,
          isDrawerOpen,
        }}
      >
        <ProductTourDrawer />
      </ProductTourControlsProvider>
    </View>
  );
};
