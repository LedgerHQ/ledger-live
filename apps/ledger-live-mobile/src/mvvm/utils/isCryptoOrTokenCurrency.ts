import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { isObject } from "./isObject";

export function isCryptoOrTokenCurrency(
  currency: unknown,
): currency is CryptoCurrency | TokenCurrency {
  if (!isObject(currency)) return false;
  return typeof currency["id"] === "string";
}
