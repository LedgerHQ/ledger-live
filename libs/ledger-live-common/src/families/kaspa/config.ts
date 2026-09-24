import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const kaspaConfig: Record<string, ConfigInfo> = {
  config_currency_kaspa: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      infra: {
        API_KASPA_ENDPOINT: "https://kaspa.coin.ledger.com",
      },
    },
  },
};
