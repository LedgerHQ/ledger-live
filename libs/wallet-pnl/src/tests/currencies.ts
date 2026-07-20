import { CoinType } from "@ledgerhq/types-cryptoassets";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

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
