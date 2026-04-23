export type ProductTourDrawerViewModel = {
  readonly isDrawerOpen: boolean;
  readonly openProductTour: () => void;
  readonly closeProductTour: () => void;
};

export type ProductTourDrawerProps = {
  readonly isDrawerOpen: boolean;
};
