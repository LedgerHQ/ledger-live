export interface Q3WalletV4TourDrawerViewModel {
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
  readonly closeDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
}
