export { encodeURIScheme, decodeURIScheme } from "./CurrencyURIScheme";
export { sanitizeValueString } from "./sanitizeValueString";
export { toLocaleString } from "./BigNumberToLocaleString";
export { setCurrenciesResolver, getCurrenciesResolver } from "./resolver";
export type { CurrenciesResolver } from "./resolver";

import type { CryptoCurrency } from "../types";
import { getCurrenciesResolver } from "./resolver";

export function getCryptoCurrencyById(id: string): CryptoCurrency {
  return getCurrenciesResolver().getCryptoCurrencyById(id);
}

export function findCryptoCurrencyById(id: string): CryptoCurrency | undefined {
  return getCurrenciesResolver().findCryptoCurrencyById(id);
}

export function findCryptoCurrencyByScheme(scheme: string | undefined): CryptoCurrency | undefined {
  return getCurrenciesResolver().findCryptoCurrencyByScheme(scheme);
}

export function listCryptoCurrencies(includeTerminated?: boolean): CryptoCurrency[] {
  return getCurrenciesResolver().listCryptoCurrencies(includeTerminated);
}

export function hasCryptoCurrencyId(id: string): boolean {
  return getCurrenciesResolver().hasCryptoCurrencyId(id);
}
