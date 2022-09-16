import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
  CryptoCurrencyIds,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "../env";

// set by user side effect to precise which currencies are considered supported (typically by live)
let userSupportedCurrencies: CryptoCurrency[] = [];
let userSupportedFiats: FiatCurrency[] = [];
// Current list was established with what our API really supports
// to update the list,
// 1. $ ledger-live countervalues --format supportedFiats --fiats
// 2. copy & paste the output
setSupportedFiats([
  "AED",
  "AUD",
  "BGN",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CRC",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "GHS",
  "HKD",
  "HRK",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "IRR",
  "JPY",
  "KES",
  "KHR",
  "KRW",
  "MUR",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RON",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TZS",
  "UAH",
  "UGX",
  "USD",
  "VES",
  "VND",
  "VUV",
  "ZAR",
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
  userSupportedCurrencies = Array.from(new Set(ids)) // Make sure to remove duplicates
    .map((id) => getCryptoCurrencyById(id));
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
export function isCurrencySupported(currency: CryptoCurrency): boolean {
  return listSupportedCurrencies().includes(currency);
}
