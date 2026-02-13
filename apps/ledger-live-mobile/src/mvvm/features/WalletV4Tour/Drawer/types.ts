export interface WalletV4TourDrawerViewModel {
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
  readonly slides: WalletV4TourSlide[];
}

export type WalletV4TourSlide = {
  readonly title: string;
  readonly description: string;
  readonly lottieSrc: number;
};
