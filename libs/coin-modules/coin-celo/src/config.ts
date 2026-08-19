import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import type { EvmCoinConfig } from "@ledgerhq/coin-evm/config";

/**
 * Celo is an EVM chain, but it owns its own coin-config injection rather than relying on coin-evm's
 * singleton being seeded by `createApi`. The wallet layer seeds this via {@link setCoinConfig} (with
 * `getCurrencyConfiguration("celo")`) and the Celo bridge reads it back through {@link getCoinConfig}.
 */
export type CeloCoinConfig = (currencyId: string) => EvmCoinConfig;

let coinConfig: CeloCoinConfig | undefined;

export const setCoinConfig = (config: CeloCoinConfig): void => {
  coinConfig = config;
};

export const getCoinConfig = (currencyId: string): EvmCoinConfig => {
  if (!coinConfig) {
    throw new Error("Celo module config not set");
  }

  return coinConfig(currencyId);
};

export const celoConfig: Record<string, ConfigInfo> = {
  config_currency_celo: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", type: "active" },
          { id: "staking_txs", type: "active" },
        ],
      },
      node: {
        type: "external",
        uri: "https://celo.coin.ledger.com/archive",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42220",
      },
    },
  },
};
