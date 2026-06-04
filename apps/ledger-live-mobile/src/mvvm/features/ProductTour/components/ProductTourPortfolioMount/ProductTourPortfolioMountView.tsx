import React, { useRef } from "react";
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
  // Latch mounting once eligible. Completing the tour flips `isProductTourEligible` and `isDrawerOpen`
  // to false in the same render; without this latch the drawer would unmount mid-dismiss, leaving a
  // stale entry in the modal provider that blocks every subsequent drawer. Once mounted it stays
  // mounted (closed, idle) for the session.
  const hasBeenEligibleRef = useRef(isProductTourEligible);
  if (isProductTourEligible) {
    hasBeenEligibleRef.current = true;
  }

  if (!hasBeenEligibleRef.current && !isDrawerOpen) {
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
