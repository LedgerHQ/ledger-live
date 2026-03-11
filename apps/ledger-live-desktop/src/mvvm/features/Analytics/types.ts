import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange } from "@ledgerhq/types-live";

export type AllocationTableItem = {
  currency: CryptoOrTokenCurrency;
  balance: number;
  distribution: number;
};

export type AllocationViewProps = {
  readonly items: AllocationTableItem[];
  readonly hasMore: boolean;
  readonly showMore: () => void;
  readonly onItemClick: (item: AllocationTableItem) => void;
};

export type AnalyticsViewModel = {
  navigateToDashboard: () => void;
  counterValue: Currency;
  selectedTimeRange: PortfolioRange;
  shouldDisplayGraphRework?: boolean;
  shouldDisplayAssetSection?: boolean;
  allocation: AllocationViewProps;
};
