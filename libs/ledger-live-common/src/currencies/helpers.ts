import { CryptoCurrency } from "@domain/entity-currency";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

export function isCryptoCurrency<T extends { type: string }>(
  currency: T,
): currency is Extract<T, { type: "CryptoCurrency" }> {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency<T extends { type: string }>(
  currency: T,
): currency is Extract<T, { type: "TokenCurrency" }> {
  return currency.type === "TokenCurrency";
}

export function isUTXOCompliant(currencyFamily: string): boolean {
  return currencyFamily === "bitcoin" || currencyFamily === "cardano";
}

export type CurrencyFilters = {
  currencies?: string[];
};

export function getFamilyByCurrencyId(currencyId: string): CryptoCurrency["family"] | undefined {
  const currency = findCryptoCurrencyById(currencyId);
  return currency?.family;
}
