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
  // Latch on the first eligible render and stay mounted for the session. Completing the tour flips
  // eligibility to false mid-dismiss; without the latch the drawer would unmount and leave a stale
  // entry in the modal provider, blocking every subsequent drawer.
  const hasBeenEligibleRef = useRef(isProductTourEligible);
  if (isProductTourEligible) {
    hasBeenEligibleRef.current = true;
  }

  if (!hasBeenEligibleRef.current) {
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
