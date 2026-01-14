import type { ConcordiumCoinConfig } from "@ledgerhq/coin-concordium/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const concordiumConfig: Record<string, ConfigInfo> = {
  config_currency_concordium: {
    type: "object",
    default: {
      status: { type: "active" },
      networkType: "mainnet",
      grpcUrl: "https://grpc.mainnet.concordium.software",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.mainnet.concordium.software",
      minReserve: 0,
    } satisfies ConcordiumCoinConfig,
  },
  config_currency_concordium_testnet: {
    type: "object",
    default: {
      status: { type: "active" },
      networkType: "testnet",
      grpcUrl: "https://grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
    } satisfies ConcordiumCoinConfig,
  },
};
