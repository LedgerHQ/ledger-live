import type { ReactNode } from "react";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import type { AssetTableItem } from "@features/platform-assets-table";

/** Router state hint so asset detail can resolve ledger id ≠ market id (e.g. xStocks). */
export type AssetNavigationMarketState = Pick<MarketCurrencyData, "id" | "ledgerIds">;

export type AssetsProps = {
  readonly afterCryptosSection?: ReactNode;
};

export type AssetsViewModelResult = {
  readonly isLoading: boolean;
  readonly sections: AssetSectionData[];
};

export type AssetsViewProps = AssetsViewModelResult & AssetsProps;

export type AssetSectionData = {
  readonly sectionId: string;
  readonly title: string;
  readonly items: AssetTableItem[];
  readonly totalCount: number;
  readonly onNavigate: () => void;
  readonly onItemClick: (item: AssetTableItem) => void;
};
