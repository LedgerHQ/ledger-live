import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { AssetTableItem } from "LLD/components/AssetsTable/types";

/** Router state hint so asset detail can resolve ledger id ≠ market id (e.g. xStocks). */
export type AssetNavigationMarketState = Pick<MarketCurrencyData, "id" | "ledgerIds">;

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
