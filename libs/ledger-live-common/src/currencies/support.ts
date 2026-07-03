import {
  getCryptoCurrencyById,
  getFiatCurrencyByTicker,
  hasFiatCurrencyTicker,
} from "@ledgerhq/cryptoassets";
import { CryptoCurrency, FiatCurrency } from "@ledgerhq/types-cryptoassets";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";

let userSupportedFiats: FiatCurrency[] | null = null;

// The API returns Coingeko countervalues tickers, but getFiatCurrencyByTicker might not support each of those.
const locallySupportedFiats = [
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

export const OFAC_CURRENCIES = [
  "AFN",
  "BYN",
  "CUP",
  "CUC",
  "IRR",
  "IQD",
  "KPW",
  "RUB",
  "SDG",
  "SYP",
  "MMK",
];

async function initializeUserSupportedFiats() {
  const remoteSupportedTokens = await fetchSupportedFiatsTokens();
  let supportedTokens: string[] = [];

  if (remoteSupportedTokens.length !== 0) {
    remoteSupportedTokens.forEach(token => {
      if (hasFiatCurrencyTicker(token)) {
        supportedTokens.push(token);
      }
    });
  } else {
    supportedTokens = locallySupportedFiats;
  }
  userSupportedFiats = supportedTokens
    .filter(currency => !OFAC_CURRENCIES.includes(currency))
    .map(getFiatCurrencyByTicker);
}

async function fetchSupportedFiatsTokens(): Promise<string[]> {
  try {
    const response = await fetch(`${getEnv("LEDGER_COUNTERVALUES_API")}/v3/supported/fiat`, {
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
    return [];
  }
}

export async function listSupportedFiats(): Promise<FiatCurrency[]> {
  if (userSupportedFiats === null) {
    // Handle case where userSupportedFiats is not yet populated (e.g., by calling initializeUserSupportedFiats)
    try {
      await initializeUserSupportedFiats();
    } catch (error) {
      // Handle initialization error
      log("debug", `Failed to initialize userSupportedFiats. Error Message: ${error}`);
      return userSupportedFiats || [];
    }
    return userSupportedFiats || [];
  }
  return userSupportedFiats;
}

/**
 * The only cryptocurrencies ever offered as a countervalue (Settings counter-value picker
 * and the Market countervalue picker). Resolved once by id — never by ticker, which is
 * ambiguous across currencies.
 */
export const countervalueCryptoCurrencies: CryptoCurrency[] = ["bitcoin", "ethereum"].map(id =>
  getCryptoCurrencyById(id),
);

/**
 * Resolve a countervalue crypto currency from its ticker within the closed set of
 * {@link countervalueCryptoCurrencies}. Unlike findCryptoCurrencyByTicker, this never scans
 * the whole registry, so it can't return an arbitrary ambiguous-ticker winner.
 */
export function findCountervalueCryptoCurrencyByTicker(
  ticker: string | undefined | null,
): CryptoCurrency | undefined {
  if (!ticker) return undefined;
  const upperTicker = ticker.toUpperCase();
  return countervalueCryptoCurrencies.find(c => c.ticker === upperTicker);
}
