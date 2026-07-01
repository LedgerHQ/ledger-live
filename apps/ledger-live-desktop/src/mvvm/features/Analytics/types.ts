import { CryptoOrTokenCurrency, Currency } from "@ledgerhq/types-cryptoassets";
import { Portfolio, PortfolioRange } from "@ledgerhq/types-live";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";

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
  balanceInfo: PortfolioBalanceInfo;
  portfolio: Portfolio;
  isLoading: boolean;
  shouldDisplayAssetSection?: boolean;
  shouldDisplayPnl: boolean;
};
