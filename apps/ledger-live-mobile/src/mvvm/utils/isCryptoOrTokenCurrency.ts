import { CryptoCurrency } from "@domain/entity-currency-crypto";
import { TokenCurrency } from "@domain/entity-currency-token";
import { isObject } from "./isObject";

export function isCryptoOrTokenCurrency(
  currency: unknown,
): currency is CryptoCurrency | TokenCurrency {
  if (!isObject(currency)) return false;
  return typeof currency["id"] === "string";
}
