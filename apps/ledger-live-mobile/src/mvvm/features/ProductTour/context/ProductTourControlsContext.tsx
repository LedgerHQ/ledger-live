import React, { createContext, useContext, useMemo } from "react";

export type ProductTourControls = {
  readonly openProductTour: () => void;
  readonly closeProductTour: () => void;
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
    }),
    [value.openProductTour, value.closeProductTour],
  );

  return (
    <ProductTourControlsContext.Provider value={stable}>{children}</ProductTourControlsContext.Provider>
  );
};

export const useProductTourControls = (): ProductTourControls | null =>
  useContext(ProductTourControlsContext);
