import { CoinType } from "@ledgerhq/types-cryptoassets";
import type { CryptoCurrency, FiatCurrency } from "@ledgerhq/types-cryptoassets";

// Minimal currency fixtures so tests don't depend on @ledgerhq/cryptoassets.
// Only the fields consumed by the countervalues logic and the account mocks are populated.

const bitcoin: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "bitcoin",
  name: "Bitcoin",
  ticker: "BTC",
  managerAppName: "Bitcoin",
  coinType: CoinType.BTC,
  scheme: "bitcoin",
  color: "#ffae35",
  family: "bitcoin",
  explorerViews: [],
  units: [
    { name: "bitcoin", code: "BTC", magnitude: 8 },
    { name: "satoshi", code: "sat", magnitude: 0 },
  ],
};

const ethereum: CryptoCurrency = {
  type: "CryptoCurrency",
  id: "ethereum",
  name: "Ethereum",
  ticker: "ETH",
  managerAppName: "Ethereum",
  coinType: CoinType.ETH,
  scheme: "ethereum",
  color: "#0ebdcd",
  family: "evm",
  ethereumLikeInfo: { chainId: 1 },
  explorerViews: [],
  units: [{ name: "ether", code: "ETH", magnitude: 18 }],
};

const cryptoById: Record<string, CryptoCurrency> = { bitcoin, ethereum };

export function getCryptoCurrencyById(id: string): CryptoCurrency {
  const currency = cryptoById[id];
  if (!currency) throw new Error(`mock crypto currency not found: ${id}`);
  return currency;
}

const usd: FiatCurrency = {
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "dollar", code: "USD", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

const eur: FiatCurrency = {
  type: "FiatCurrency",
  name: "Euro",
  ticker: "EUR",
  symbol: "€",
  units: [{ name: "euro", code: "EUR", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

const fiatByTicker: Record<string, FiatCurrency> = { USD: usd, EUR: eur };

export function getFiatCurrencyByTicker(ticker: string): FiatCurrency {
  const currency = fiatByTicker[ticker];
  if (!currency) throw new Error(`mock fiat currency not found: ${ticker}`);
  return currency;
}
