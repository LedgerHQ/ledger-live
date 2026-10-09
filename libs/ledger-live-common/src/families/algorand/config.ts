import type { AlgorandCoinConfig } from "@ledgerhq/coin-algorand/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

const baseUrl = getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT");

export const algorandConfig: Record<string, ConfigInfo> = {
  config_currency_algorand: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      name: "Algorand",
      unit: { name: "ALGO", code: "ALGO", magnitude: 6 },
      node: `${baseUrl}/ps2/v2`,
      indexer: `${baseUrl}/idx2/v2`,
    } satisfies AlgorandCoinConfig,
  },
};
