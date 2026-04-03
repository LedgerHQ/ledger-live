import { CurrencyIdSchema } from "@shared/schema-primitives";
import type { CryptoCurrency } from "./schema";

export function mockCryptoCurrency(overrides?: Partial<CryptoCurrency>): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id: CurrencyIdSchema.parse("bitcoin"),
    name: "Bitcoin",
    ticker: "BTC",
    units: [
      { name: "bitcoin", code: "BTC", magnitude: 8 },
      { name: "satoshi", code: "SAT", magnitude: 0 },
    ],
    managerAppName: "Bitcoin",
    coinType: 0,
    scheme: "bitcoin",
    color: "#FBAE41",
    family: "bitcoin",
    explorerViews: [
      {
        tx: "https://blockstream.info/tx/$hash",
        address: "https://blockstream.info/address/$address",
      },
    ],
    bitcoinLikeInfo: { P2PKH: 0, P2SH: 5 },
    ...overrides,
  };
}

export function mockEthereumCurrency(overrides?: Partial<CryptoCurrency>): CryptoCurrency {
  return mockCryptoCurrency({
    id: CurrencyIdSchema.parse("ethereum"),
    name: "Ethereum",
    ticker: "ETH",
    units: [
      { name: "ether", code: "ETH", magnitude: 18 },
      { name: "Gwei", code: "Gwei", magnitude: 9 },
      { name: "wei", code: "wei", magnitude: 0 },
    ],
    managerAppName: "Ethereum",
    coinType: 60,
    scheme: "ethereum",
    color: "#0ebdcd",
    family: "ethereum",
    explorerViews: [
      {
        tx: "https://etherscan.io/tx/$hash",
        address: "https://etherscan.io/address/$address",
      },
    ],
    bitcoinLikeInfo: undefined,
    ethereumLikeInfo: { chainId: 1 },
    blockAvgTime: 15,
    tokenTypes: ["erc20"],
    ...overrides,
  });
}
