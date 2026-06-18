import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";

/** Router state hint so asset detail can resolve ledger id ≠ market id (e.g. xStocks). */
export type AssetNavigationMarketState = Pick<MarketCurrencyData, "id" | "ledgerIds">;

export type AssetTableItem = CategorizedAssetItem & {
  isPlaceholder: boolean;
  marketPrice?: number;
  marketId?: string;
  trend?: number | null;
};

export type AssetsViewProps = {
  readonly isLoading: boolean;
  readonly sections: AssetSectionData[];
};

export type AssetSectionData = {
  readonly sectionId: string;
  readonly title: string;
  readonly items: AssetTableItem[];
  readonly totalCount: number;
  readonly onNavigate: () => void;
  readonly onItemClick: (item: AssetTableItem) => void;
};
