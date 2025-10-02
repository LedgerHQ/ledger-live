import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";

function getNetworksForAsset(
  assetsSorted: AssetData[] | undefined,
  assetId: string,
  deactivatedAssets: Set<string>,
) {
  return (
    assetsSorted
      ?.find(elem => elem.asset.id === assetId)
      ?.networks.filter(
        elem =>
          !deactivatedAssets.has(elem.type === "CryptoCurrency" ? elem.id : elem.parentCurrency.id),
      ) ?? []
  );
}

function resolveCurrency(
  assetsSorted: AssetData[] | undefined,
  deactivatedAssets: Set<string>,
  selectedAsset?: CryptoOrTokenCurrency,
  selectedNetwork?: CryptoOrTokenCurrency,
): CryptoOrTokenCurrency | undefined {
  if (!selectedAsset) return undefined;
  if (!selectedNetwork) return selectedAsset;

  const networksForAsset = getNetworksForAsset(assetsSorted, selectedAsset.id, deactivatedAssets);
  const correspondingCurrency = networksForAsset.find(n =>
    n.type === "CryptoCurrency"
      ? n.id === selectedNetwork.id
      : n.parentCurrency.id === selectedNetwork.id,
  );

  return correspondingCurrency ?? selectedAsset;
}

export { getNetworksForAsset, resolveCurrency };
