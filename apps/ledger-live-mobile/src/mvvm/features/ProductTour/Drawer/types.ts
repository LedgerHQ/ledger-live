import type { ProductTourPrimaryAction } from "./const";

export interface ProductTourDrawerViewModel {
  readonly isDrawerOpen: boolean;
  readonly openProductTour: () => void;
  readonly closeProductTour: () => void;
  readonly onPrimaryAction: (action: ProductTourPrimaryAction) => void;
  readonly onSlideChange: (index: number) => void;
}

/** Context value passed from portfolio mount — same shape as the drawer VM to avoid drift. */
export type ProductTourControls = ProductTourDrawerViewModel;
