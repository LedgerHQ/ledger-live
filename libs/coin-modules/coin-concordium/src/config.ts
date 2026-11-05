import buildCoinConfig from "@ledgerhq/coin-module-framework/config";
import type { ConcordiumCoinConfig } from "./types/config";

export type { ConcordiumCoinConfig } from "./types/config";

const { setCoinConfig, getCoinConfig } = buildCoinConfig<ConcordiumCoinConfig>();

export default { setCoinConfig, getCoinConfig };

export const concordiumDefaults = {
  concordium: {
    status: { type: "active" },
    name: "Concordium",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "mainnet",
    proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
    minReserve: 0,
    enableTokens: false,
  },
  concordium_testnet: {
    status: { type: "active" },
    name: "Concordium (Testnet)",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "testnet",
    proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
    minReserve: 0,
    enableTokens: false,
  },
} satisfies Record<string, ConcordiumCoinConfig>;
