import type { MultiversXCoinConfig } from "@ledgerhq/coin-multiversx/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const multiversxConfig: Record<string, ConfigInfo> = {
  config_currency_multiversx: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      infra: {
        MULTIVERSX_API_ENDPOINT: "https://elrond.coin.ledger.com",
        MULTIVERSX_DELEGATION_API_ENDPOINT: "https://delegations-elrond.coin.ledger.com",
      },
    } satisfies MultiversXCoinConfig,
  },
};
