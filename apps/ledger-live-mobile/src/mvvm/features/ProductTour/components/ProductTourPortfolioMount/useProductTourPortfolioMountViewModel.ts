import { useProductTourDrawerViewModel } from "../../Drawer/hooks/useProductTourDrawerViewModel";
import type { ProductTourDrawerViewModel } from "../../Drawer/types";
import { useProductTourEligibility } from "../../hooks/useProductTourEligibility";

export type UseProductTourPortfolioMountViewModelResult = ProductTourDrawerViewModel & {
  readonly isProductTourEligible: boolean;
};

export const useProductTourPortfolioMountViewModel =
  (): UseProductTourPortfolioMountViewModelResult => {
    const { isProductTourEligible } = useProductTourEligibility();
    const {
      openProductTour,
      closeProductTour,
      onCloseButtonPress,
      onSlideChange,
      isDrawerOpen,
      onPrimaryAction,
      completeProductTour,
    } = useProductTourDrawerViewModel();

    return {
      isProductTourEligible,
      openProductTour,
      closeProductTour,
      onCloseButtonPress,
      onSlideChange,
      isDrawerOpen,
      onPrimaryAction,
      completeProductTour,
    };
  };
