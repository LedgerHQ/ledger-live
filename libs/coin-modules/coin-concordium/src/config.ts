import type { ConcordiumBridgeConfig } from "./types/config";

export type {
  ConcordiumBridgeConfig,
  ConcordiumBridgeContext,
  ConcordiumCoinConfig,
  ConcordiumConfig,
  ConcordiumContext,
} from "./types/config";

export const concordiumDefaults = {
  concordium: {
    status: { type: "active" },
    name: "Concordium",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "mainnet",
    proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
    walletConnect: { relayUrl: "wss://relay.walletconnect.com" },
  },
  concordium_testnet: {
    status: { type: "active" },
    name: "Concordium (Testnet)",
    unit: { name: "ccd", code: "CCD", magnitude: 6 },
    networkType: "testnet",
    proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
    walletConnect: { relayUrl: "wss://relay.walletconnect.com" },
  },
} satisfies Record<string, ConcordiumBridgeConfig>;
