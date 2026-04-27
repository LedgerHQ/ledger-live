import { useProductTourDrawerViewModel } from "../../Drawer";
import type { ProductTourDrawerViewModel } from "../../Drawer/types";
import { useProductTourEligibility } from "../../hooks/useProductTourEligibility";

export type UseProductTourPortfolioMountViewModelResult = ProductTourDrawerViewModel & {
  readonly isProductTourEligible: boolean;
};

export const useProductTourPortfolioMountViewModel =
  (): UseProductTourPortfolioMountViewModelResult => {
    const { isProductTourEligible } = useProductTourEligibility();
    const { openProductTour, closeProductTour, isDrawerOpen } = useProductTourDrawerViewModel();

    return {
      isProductTourEligible,
      openProductTour,
      closeProductTour,
      isDrawerOpen,
    };
  };
