import { CategorizedAssetItem } from "@ledgerhq/asset-aggregation/assetCategorization/types";
import { Asset } from "~/types/asset";

export const toAsset = (item: CategorizedAssetItem): Asset => ({
  currency: item.currency,
  accounts: item.accounts,
  amount: item.balance,
  distribution: item.distribution,
  isPlaceholder: false,
});
