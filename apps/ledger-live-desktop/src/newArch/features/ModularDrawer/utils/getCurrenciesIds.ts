import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

/**
 * This function retrieves the IDs of a list of cryptocurrencies or token currencies.
 *
 * @param {CryptoOrTokenCurrency[]} currencies - An array of cryptocurrencies or token currencies.
 * @returns {string[]} - An array of IDs corresponding to the provided currencies.
 */
export const getCurrenciesIds = (currencies: CryptoOrTokenCurrency[]): string[] => {
  return currencies.map(currency => currency.id);
};
