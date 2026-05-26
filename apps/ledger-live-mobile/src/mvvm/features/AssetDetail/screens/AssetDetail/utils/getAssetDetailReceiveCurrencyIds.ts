import type { AssetsDataWithPagination } from "@ledgerhq/live-common/dada-client/state-manager/types";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { ReceiveCurrencyIds } from "LLM/features/Receive/types";

type AssetDetailReceiveAssetData = Pick<AssetsDataWithPagination, "cryptoAssets">;

export function getAssetDetailReceiveCurrencyIds(
  currency: AssetDetailCurrencyProps,
  assetData: AssetDetailReceiveAssetData | undefined,
): ReceiveCurrencyIds | undefined {
  if (!currency) return undefined;

  const cryptoAssets = assetData ? Object.values(assetData.cryptoAssets) : [];
  const matchingAsset =
    cryptoAssets.find(
      asset => asset.id === currency.id || Object.values(asset.assetsIds).includes(currency.id),
    ) ?? cryptoAssets[0];

  const ids = matchingAsset ? Object.values(matchingAsset.assetsIds).filter(Boolean) : [];

  return Array.from(new Set(ids.length > 0 ? ids : [currency.id]));
}
