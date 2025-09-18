import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetsData } from "../hooks/useAssets";

function getNetworksForAsset(assetsSorted: AssetsData, assetId: string) {
  return assetsSorted?.find(elem => elem.asset.id === assetId)?.networks ?? [];
}

function resolveCurrency(
  assetsSorted: AssetsData,
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
