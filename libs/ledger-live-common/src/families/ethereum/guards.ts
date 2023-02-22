import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";

export const isEthereumFamily = (
  currency: Currency
): currency is CryptoCurrency => {
  return currency.type === "CryptoCurrency" && currency.family === "ethereum";
};
