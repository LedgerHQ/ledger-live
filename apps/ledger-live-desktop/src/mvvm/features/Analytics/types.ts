import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { PortfolioRange } from "@ledgerhq/types-live";

export type AllocationTableItem = {
  currency: CryptoOrTokenCurrency;
  balance: number;
  value: number | undefined;
  distribution: number;
};

export type AllocationViewProps = {
  readonly items: AllocationTableItem[];
  readonly totalCount: number;
};

export type AnalyticsViewModel = {
  navigateToDashboard: () => void;
  counterValue: Currency;
  selectedTimeRange: PortfolioRange;
  shouldDisplayGraphRework?: boolean;
  shouldDisplayAssetSection?: boolean;
  allocation: AllocationViewProps;
};
