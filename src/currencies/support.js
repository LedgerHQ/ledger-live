// @flow

import type {
  FiatCurrency,
  CryptoCurrency,
  CryptoCurrencyIds,
} from "@ledgerhq/cryptoassets/lib/types";
import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
} from "@ledgerhq/cryptoassets";
import { getEnv } from "../env";

// set by user side effect to precise which currencies are considered supported (typically by live)
let userSupportedCurrencies: CryptoCurrency[] = [];

let userSupportedFiats = [];
// Current list was established with what our API really supports
setSupportedFiats([
  "CAD",
  "CHF",
  "EUR",
  "GBP",
  "HKD",
  "ILS",
  "JPY",
  "KRW",
  "MXN",
  "PLN",
  "RUB",
  "SGD",
  "TRY",
  "USD",
]);

export function isFiatSupported(fiat: FiatCurrency) {
  return userSupportedFiats.includes(fiat);
}

export function setSupportedFiats(ids: string[]) {
  userSupportedFiats = ids.map(getFiatCurrencyByTicker);
}

export function listSupportedFiats(): FiatCurrency[] {
  return userSupportedFiats;
}

export function setSupportedCurrencies(ids: CryptoCurrencyIds[]) {
  userSupportedCurrencies = ids.map((id) => getCryptoCurrencyById(id));
}

function getExperimentalSupports() {
  return getEnv("EXPERIMENTAL_CURRENCIES")
    .split(",")
    .filter(
      (id) =>
        hasCryptoCurrencyId(id) &&
        !userSupportedCurrencies.find((c) => c.id === id)
    )
    .map(getCryptoCurrencyById);
}

export function listSupportedCurrencies(): CryptoCurrency[] {
  const experimentals = getExperimentalSupports();
  return experimentals.length === 0
    ? userSupportedCurrencies
    : userSupportedCurrencies.concat(experimentals);
}

export function isCurrencySupported(currency: CryptoCurrency) {
  return listSupportedCurrencies().includes(currency);
}
