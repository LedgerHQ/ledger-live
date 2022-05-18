import { Currency, CryptoCurrency, TokenCurrency } from "../types";

export function isCryptoCurrency(
  currency: Currency
): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency(currency: Currency): currency is TokenCurrency {
  return currency.type === "TokenCurrency";
}
