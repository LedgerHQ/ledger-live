import { Currency, CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets";

export function isCryptoCurrency(currency: Currency): currency is CryptoCurrency {
  return currency.type === "CryptoCurrency";
}

export function isTokenCurrency(currency: Currency): currency is TokenCurrency {
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
