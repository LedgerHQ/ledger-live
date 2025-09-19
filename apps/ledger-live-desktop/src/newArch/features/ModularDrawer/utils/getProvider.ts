import { AssetData } from "@ledgerhq/live-common/modularDrawer/utils/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * This function retrieves the provider for a given cryptocurrency or token currency
 * from a list of currencies by provider.
 *
 * @param {CryptoCurrency | TokenCurrency} currency - The cryptocurrency or token currency to find the provider for.
 * @param {Asset[]} assets - An array of assets grouped by provider.
 * @returns {Asset | undefined} - The provider that contains the given currency, or undefined if not found.
 */
export const getProvider = (
  currency: CryptoCurrency | TokenCurrency,
  assets: AssetData[] | undefined,
) =>
  currency &&
  assets?.find(elem =>
    elem.networks.some(currencyByNetwork => currencyByNetwork.id === currency.id),
  );
