import { AssetData } from "./type";

/**
 * This function checks if all currencies in the provided array
 * it stopped at the first currency that does not match to prevent unnecessary iterations.
 *
 * @param currenciesIdsArray array of currency IDs to check
 * @param currenciesByProvider array of currencies grouped by provider
 * @returns boolean indicating whether all currencies in the array have one common provider
 */

export const haveOneCommonAsset = (
  currenciesIdsArray: string[],
  currenciesByProvider: AssetData[],
): boolean => {
  if (currenciesIdsArray.length === 0) return false;

  const providerIds = new Set<string>();

  for (const currencyId of currenciesIdsArray) {
    for (const provider of currenciesByProvider) {
      if (provider.networks.some(currency => currency.id === currencyId)) {
        providerIds.add(provider.asset.id);
        if (providerIds.size > 1) {
          return false;
        }
      }
    }
  }

  return true;
};
