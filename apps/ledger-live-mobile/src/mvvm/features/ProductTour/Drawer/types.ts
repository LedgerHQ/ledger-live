export interface ProductTourDrawerViewModel {
  readonly productTourCompleted: boolean;
  readonly isDrawerOpen: boolean;
  readonly openDrawer: () => void;
  readonly closeDrawer: () => void;
  readonly handleCloseDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
}
