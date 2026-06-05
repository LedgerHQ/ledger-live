import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { LineChartRange } from "LLD/components/LineChart";

type AssetDetailNotFound = Readonly<{ mode: "not-found" }>;

export type AssetDetailReady = Readonly<{
  mode: "ready";
  distributionItem?: DistributionItem;
  marketData: AssetMarketData;
  isDistributionLoading: boolean;
  ledgerCurrency?: CryptoOrTokenCurrency;
  ledgerIds: string[];
  displayName: string;
  displayTicker: string;
  ledgerId?: string;
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
}>;

export type AssetDetailViewModel = AssetDetailNotFound | AssetDetailReady;
