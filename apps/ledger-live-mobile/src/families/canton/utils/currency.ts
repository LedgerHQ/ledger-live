import { CryptoCurrency, Currency } from "@ledgerhq/types-cryptoassets";

export function isCantonCurrency(currency: Currency): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency" && currency.family === "canton";
}
