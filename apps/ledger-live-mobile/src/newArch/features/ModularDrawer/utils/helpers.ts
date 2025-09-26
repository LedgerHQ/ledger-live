import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

function getNetworksForAsset(assetsSorted: AssetData[] = [], assetId: string) {
  return assetsSorted?.find(elem => elem.asset.id === assetId)?.networks ?? [];
}

function resolveCurrency(
  assetsSorted: AssetData[] = [],
  selectedAsset?: CryptoOrTokenCurrency,
  selectedNetwork?: CryptoOrTokenCurrency,
): CryptoOrTokenCurrency | undefined {
  if (!selectedAsset) return undefined;
  if (!selectedNetwork) return selectedAsset;

  const networksForAsset = getNetworksForAsset(assetsSorted, selectedAsset.id);
  const correspondingCurrency = networksForAsset.find(n =>
    n.type === "CryptoCurrency"
      ? n.id === selectedNetwork.id
      : n.parentCurrency.id === selectedNetwork.id,
  );

  return correspondingCurrency ?? selectedAsset;
}

export { getNetworksForAsset, resolveCurrency };
