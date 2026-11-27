import type { ConcordiumBridgeConfig } from "./types/config";

export type {
  ConcordiumBridgeConfig,
  ConcordiumBridgeContext,
  ConcordiumCoinConfig,
  ConcordiumConfig,
  ConcordiumContext,
} from "./types/config";

const tuning = {
  minReserve: 0,
  enableTokens: false,
  gateway: {
    timeoutMs: 30_000,
    retries: 2,
    retryDelayMs: 1_000,
    maxTxQuery: 1_000,
    pltModuleStateCacheTtlMs: 300_000,
    accountTokensCacheTtlMs: 30_000,
  },
  fees: { defaultCost: 1_000_000, pltEnergyBufferPercent: 20 },
  tokens: { calLookupConcurrency: 4 },
};

const walletConnect = {
  relayUrl: "wss://relay.walletconnect.com",
  projectId: "053f3301d5f72cf59dbab8ebeab71f23",
};

export const concordiumDefaults = {
  concordium: {
    status: { type: "active" },
    name: "Concordium",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "mainnet",
    proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
    ...tuning,
    walletConnect,
  },
  concordium_testnet: {
    status: { type: "active" },
    name: "Concordium (Testnet)",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "testnet",
    proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
    ...tuning,
    walletConnect,
  },
} satisfies Record<string, ConcordiumBridgeConfig>;
