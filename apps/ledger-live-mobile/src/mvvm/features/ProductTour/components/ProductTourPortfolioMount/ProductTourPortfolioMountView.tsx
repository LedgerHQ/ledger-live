import React from "react";
import { View } from "react-native";
import { ProductTourControlsProvider } from "../../context/ProductTourControlsContext";
import { ProductTourDrawer } from "../../Drawer";
import type { UseProductTourPortfolioMountViewModelResult } from "./useProductTourPortfolioMountViewModel";

export const ProductTourPortfolioMountView = ({
  isProductTourEligible,
  openProductTour,
  closeProductTour,
  onCloseButtonPress,
  onSlideChange,
  isDrawerOpen,
  onPrimaryAction,
  completeProductTour,
}: UseProductTourPortfolioMountViewModelResult) => {
  if (!isProductTourEligible && !isDrawerOpen) {
    return null;
  }

  return (
    <View testID="product-tour-portfolio-mount" collapsable={false}>
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
          onCloseButtonPress,
          onSlideChange,
          isDrawerOpen,
          onPrimaryAction,
          completeProductTour,
        }}
      >
        <ProductTourDrawer />
      </ProductTourControlsProvider>
    </View>
  );
};
