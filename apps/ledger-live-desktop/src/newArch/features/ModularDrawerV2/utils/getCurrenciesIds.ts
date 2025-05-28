import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export const getCurrenciesIds = (currencies: CryptoOrTokenCurrency[]): string[] => {
  return currencies.map(currency => currency.id);
};
