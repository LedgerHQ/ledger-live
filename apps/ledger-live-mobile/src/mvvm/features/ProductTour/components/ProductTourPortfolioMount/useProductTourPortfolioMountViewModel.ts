import { useProductTourDrawerViewModel } from "../../Drawer/hooks/useProductTourDrawerViewModel";
import type { ProductTourDrawerViewModel } from "../../Drawer/types";
import { useProductTourEligibility } from "../../hooks/useProductTourEligibility";

export type UseProductTourPortfolioMountViewModelResult = ProductTourDrawerViewModel & {
  readonly isProductTourEligible: boolean;
};

export const useProductTourPortfolioMountViewModel =
  (): UseProductTourPortfolioMountViewModelResult => {
    const { isProductTourEligible } = useProductTourEligibility();
    const { openProductTour, closeProductTour, onSlideChange, isDrawerOpen, onPrimaryAction } =
      useProductTourDrawerViewModel();

    return {
      isProductTourEligible,
      openProductTour,
      closeProductTour,
      onSlideChange,
      isDrawerOpen,
      onPrimaryAction,
    };
  };
