import type { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";

export type AssetTableItem = CategorizedAssetItem & {
  isPlaceholder: boolean;
  marketPrice?: number;
  marketId?: string;
  trend?: number | null;
};
