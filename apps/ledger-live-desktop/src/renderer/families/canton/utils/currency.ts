import { CryptoCurrency, Currency } from "@domain/entity-currency";

export function isCantonCurrency(currency: Currency): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency" && currency.family === "canton";
}
