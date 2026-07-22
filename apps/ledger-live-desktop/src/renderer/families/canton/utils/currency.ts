import type { Currency } from "@domain/entity-currency";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";

export function isCantonCurrency(currency: Currency): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency" && currency.family === "canton";
}
