import type { CryptoCurrency } from "../types";

export type CurrenciesResolver = {
  getCryptoCurrencyById(id: string): CryptoCurrency;
  findCryptoCurrencyById(id: string): CryptoCurrency | undefined;
  findCryptoCurrencyByScheme(scheme: string | undefined): CryptoCurrency | undefined;
  listCryptoCurrencies(includeTerminated?: boolean): CryptoCurrency[];
  hasCryptoCurrencyId(id: string): boolean;
};

let current: CurrenciesResolver | undefined;

export function setCurrenciesResolver(resolver: CurrenciesResolver): void {
  current = resolver;
}

export function getCurrenciesResolver(): CurrenciesResolver {
  if (!current) {
    throw new Error(
      "Framework currencies resolver not initialized. Call setCurrenciesResolver() at bootstrap.",
    );
  }
  return current;
}
