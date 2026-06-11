export interface MarketCapCardViewModel {
  readonly value: string;
  readonly changePercentage: number | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean | undefined;
  readonly isDrawerOpen: boolean;
  readonly handleOpenDrawer: () => void;
  readonly handleCloseDrawer: () => void;
}

export type MarketCapCardProps = Readonly<{
  width?: number;
}>;

export type MarketCapCardViewProps = MarketCapCardViewModel & MarketCapCardProps;
