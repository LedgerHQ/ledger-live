import type { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const concordiumConfig: Record<string, ConfigInfo> = {
  config_currency_concordium: {
    type: "object",
    default: {
      status: { type: "active" },
      networkType: "mainnet",
      grpcUrl: "https://ccd-node-mainnet.coin.ledger.com",
      grpcPort: 443,
      proxyUrl: "https://ccd-wallet-proxy-mainnet.coin.ledger.com",
      minReserve: 0,
    } satisfies ConcordiumCoinConfig,
  },
  config_currency_concordium_testnet: {
    type: "object",
    default: {
      status: { type: "active" },
      networkType: "testnet",
      grpcUrl: "https://ccd-node-testnet.coin.ledger-test.com",
      grpcPort: 443,
      proxyUrl: "https://ccd-wallet-proxy-testnet.coin.ledger-test.com",
      minReserve: 0,
    } satisfies ConcordiumCoinConfig,
  },
};
