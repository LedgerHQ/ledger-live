import React from "react";
import { View } from "react-native";
import { ProductTourControlsProvider } from "../../context/ProductTourControlsContext";
import { ProductTourDrawer, useProductTourDrawerViewModel } from "../../Drawer";
import { useProductTourEligibility } from "../../hooks/useProductTourEligibility";

const ProductTourPortfolioMountWhenEnabled = () => {
  const { openProductTour, closeProductTour, isDrawerOpen } = useProductTourDrawerViewModel();

  return (
    <View testID="product-tour-portfolio-mount" collapsable={false}>
      <ProductTourControlsProvider
        value={{
          openProductTour,
          closeProductTour,
        }}
      >
        <ProductTourDrawer isDrawerOpen={isDrawerOpen} />
      </ProductTourControlsProvider>
    </View>
  );
};

export const ProductTourPortfolioMount = () => {
  const { isProductTourEligible } = useProductTourEligibility();

  if (!isProductTourEligible) {
    return null;
  }

  return <ProductTourPortfolioMountWhenEnabled />;
};
