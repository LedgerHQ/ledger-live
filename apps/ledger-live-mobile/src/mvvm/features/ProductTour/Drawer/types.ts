export interface ProductTourDrawerViewModel {
  readonly isDrawerOpen: boolean;
  readonly openProductTour: () => void;
  readonly closeProductTour: () => void;
  readonly onSlideChange: (index: number) => void;
}
