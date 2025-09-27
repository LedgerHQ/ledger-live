import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * This function retrieves the asset for a given cryptocurrency or token currency
 * from a list of assets.
 *
 * @param {CryptoCurrency | TokenCurrency} currency - The cryptocurrency or token currency to find the asset for.
 * @param {Asset[]} assets - An array of assets
 * @returns {Asset | undefined} - The asset that contains the given currency, or undefined if not found.
 */
export const getAssetByCurrency = (
  currency: CryptoCurrency | TokenCurrency,
  assets: AssetData[] | undefined,
) => {
  return (
    currency &&
    assets?.find(elem =>
      elem.networks.some(currencyByNetwork => currencyByNetwork.id === currency.id),
    )
  );
};
