import { CryptoCurrency, TokenCurrency } from "@domain/entity-currency";
import { isObject } from "./isObject";

export function isCryptoOrTokenCurrency(
  currency: unknown,
): currency is CryptoCurrency | TokenCurrency {
  if (!isObject(currency)) return false;
  return typeof currency["id"] === "string";
}
