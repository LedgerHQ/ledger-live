import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";

export const tronConfig: Record<string, ConfigInfo> = {
  config_currency_tron: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Tron",
      unit: { name: "TRX", code: "TRX", magnitude: 6 },
      explorer: {
        url: getEnv("API_TRONGRID_PROXY"),
      },
      // The sourceFlag and paymentAddresses come from the remote config only: Tronify must confirm
      // the channel name first, and an array here would merge by index under the remote one.
      energyRent: {
        provider: "tronify",
        tronify: { url: "https://tronify.api.live.ledger.com" },
      },
    },
  },
};
