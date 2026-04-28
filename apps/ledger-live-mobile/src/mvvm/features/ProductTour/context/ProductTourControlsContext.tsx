import React, { createContext, useContext, useMemo } from "react";

export type ProductTourControls = {
  readonly openProductTour: () => void;
  readonly closeProductTour: () => void;
  readonly onSlideChange: (index: number) => void;
  readonly isDrawerOpen: boolean;
};

const ProductTourControlsContext = createContext<ProductTourControls | null>(null);

type ProductTourControlsProviderProps = {
  readonly value: ProductTourControls;
  readonly children: React.ReactNode;
};

export const ProductTourControlsProvider = ({ value, children }: ProductTourControlsProviderProps) => {
  const stable = useMemo(
    () => ({
      openProductTour: value.openProductTour,
      closeProductTour: value.closeProductTour,
      onSlideChange: value.onSlideChange,
      isDrawerOpen: value.isDrawerOpen,
    }),
    [value.openProductTour, value.closeProductTour, value.onSlideChange, value.isDrawerOpen],
  );

  return (
    <ProductTourControlsContext.Provider value={stable}>{children}</ProductTourControlsContext.Provider>
  );
};

export const useProductTourControls = (): ProductTourControls | null =>
  useContext(ProductTourControlsContext);
