import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { belongsToSameNetwork } from "@ledgerhq/live-common/modularDrawer/utils/index";

function getNetworksForAsset(
  assetsSorted: AssetData[] | undefined,
  assetId: string,
  isAcceptedCurrency: (currency: CryptoOrTokenCurrency) => boolean,
) {
  return (
    assetsSorted?.find(elem => elem.asset.id === assetId)?.networks.filter(isAcceptedCurrency) ?? []
  );
}

function resolveCurrency(
  assetsSorted: AssetData[] | undefined,
  isAcceptedCurrency: (currency: CryptoOrTokenCurrency) => boolean,
  selectedAsset?: CryptoOrTokenCurrency,
  selectedNetwork?: CryptoOrTokenCurrency,
): CryptoOrTokenCurrency | undefined {
  if (!selectedAsset) return undefined;
  if (!selectedNetwork) return selectedAsset;

  const networksForAsset = getNetworksForAsset(assetsSorted, selectedAsset.id, isAcceptedCurrency);

  const correspondingCurrency = networksForAsset.find(network =>
    belongsToSameNetwork(network, selectedNetwork),
  );

  return correspondingCurrency ?? selectedAsset;
}

export { getNetworksForAsset, resolveCurrency };
