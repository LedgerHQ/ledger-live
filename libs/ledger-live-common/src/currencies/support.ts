import { getFiatCurrencyByTicker, hasFiatCurrencyTicker } from "@ledgerhq/cryptoassets";
import { FiatCurrency } from "@ledgerhq/types-cryptoassets";
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
  let supportedTokens = [] as string[];

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
