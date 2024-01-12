import {
  getFiatCurrencyByTicker,
  getCryptoCurrencyById,
  hasCryptoCurrencyId,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, CryptoCurrencyId, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";

// set by user side effect to precise which currencies are considered supported (typically by live)
let userSupportedCurrencies: CryptoCurrency[] = [];
let userSupportedFiats: FiatCurrency[] | null = null;

// The API returns Coingeko countervalues tickers, but getFiatCurrencyByTicker might not support each of those.
export const locallySupportedFiats = [
  "AED",
  "AUD",
  "BHD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CNY",
  "CZK",
  "DKK",
  "EUR",
  "GBP",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "INR",
  "JPY",
  "KRW",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "UAH",
  "USD",
  "VND",
  "ZAR",
];

async function initializeUserSupportedFiats() {
  try {
    const ids = await fetchSupportedFiatsTokens();
    let supportedTokens = locallySupportedFiats;

    if (ids.length) {
      const idsToUpper = ids?.map(id => id.toUpperCase());

      // This makes sure we only keep the elements supported in our API and that are available for getFiatCurrencyByTicker
      supportedTokens = idsToUpper.filter(token => locallySupportedFiats.includes(token));
    }
    userSupportedFiats = supportedTokens.map(id => {
      return getFiatCurrencyByTicker(id);
    });
  } catch (error) {
    throw new Error(`Failed to get supported Fiats. Error Message: ${error}`);
  }
}

export async function fetchSupportedFiatsTokens(): Promise<string[]> {
  try {
    const response = await fetch(`${getEnv("LEDGER_COUNTERVALUES_API")}/v2/supported-to`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data: string[] = await response.json();
    return data;
  } catch (error) {
    log("debug", `Failed to fetch supported fiat tokens. Error Message: ${error}`);
    throw error;
  }
}

// Usage of isFiatSupported and listSupportedFiats should check if userSupportedFiats is populated
export function isFiatSupported(fiat: FiatCurrency) {
  return userSupportedFiats?.includes(fiat);
}

export async function listSupportedFiats(): Promise<FiatCurrency[]> {
  if (userSupportedFiats === null) {
    // Handle case where userSupportedFiats is not yet populated (e.g., by calling initializeUserSupportedFiats)
    try {
      await initializeUserSupportedFiats();
    } catch (error) {
      // Handle initialization error
      log("debug", `Failed to initialize userSupportedFiats. Error Message: ${error}`);
      return [];
    }
    return userSupportedFiats || [];
  }
  return userSupportedFiats;
}

export function setSupportedCurrencies(ids: CryptoCurrencyId[]) {
  userSupportedCurrencies = Array.from(new Set(ids)) // Make sure to remove duplicates
    .map(id => getCryptoCurrencyById(id));
}

function getExperimentalSupports() {
  return getEnv("EXPERIMENTAL_CURRENCIES")
    .split(",")
    .filter(
      (id: string) => hasCryptoCurrencyId(id) && !userSupportedCurrencies.find(c => c.id === id),
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
