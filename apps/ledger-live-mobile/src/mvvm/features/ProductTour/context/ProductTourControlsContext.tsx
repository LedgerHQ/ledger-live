import React, { createContext, useContext, useMemo } from "react";
import type { ProductTourControls } from "../Drawer/types";

export type { ProductTourControls };

const ProductTourControlsContext = createContext<ProductTourControls | null>(null);

type ProductTourControlsProviderProps = {
  readonly value: ProductTourControls;
  readonly children: React.ReactNode;
};

export const ProductTourControlsProvider = ({
  value,
  children,
}: ProductTourControlsProviderProps) => {
  const stable = useMemo(
    () => ({
      openProductTour: value.openProductTour,
      closeProductTour: value.closeProductTour,
      onCloseButtonPress: value.onCloseButtonPress,
      onSlideChange: value.onSlideChange,
      isDrawerOpen: value.isDrawerOpen,
      onPrimaryAction: value.onPrimaryAction,
      completeProductTour: value.completeProductTour,
    }),
    [
      value.openProductTour,
      value.closeProductTour,
      value.onCloseButtonPress,
      value.onSlideChange,
      value.isDrawerOpen,
      value.onPrimaryAction,
      value.completeProductTour,
    ],
  );

  return (
    <ProductTourControlsContext.Provider value={stable}>
      {children}
    </ProductTourControlsContext.Provider>
  );
};

export const useProductTourControls = (): ProductTourControls => {
  const ctx = useContext(ProductTourControlsContext);
  if (ctx == null) {
    throw new Error("useProductTourControls must be used within ProductTourControlsProvider");
  }
  return ctx;
};
