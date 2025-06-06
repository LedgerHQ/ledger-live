import { CurrenciesByProviderId } from "@ledgerhq/live-common/deposit/type";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * This function retrieves the provider for a given cryptocurrency or token currency
 * from a list of currencies by provider.
 *
 * @param {CryptoCurrency | TokenCurrency} currency - The cryptocurrency or token currency to find the provider for.
 * @param {CurrenciesByProviderId[]} currenciesByProvider - An array of currencies grouped by provider.
 * @returns {CurrenciesByProviderId | undefined} - The provider that contains the given currency, or undefined if not found.
 */
export const getProvider = (
  currency: CryptoCurrency | TokenCurrency,
  currenciesByProvider: CurrenciesByProviderId[],
) =>
  currency &&
  currenciesByProvider.find(elem =>
    elem.currenciesByNetwork.some(
      currencyByNetwork => (currencyByNetwork as CryptoCurrency | TokenCurrency).id === currency.id,
    ),
  );
