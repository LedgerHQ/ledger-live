import { TezosCoinConfig } from "@ledgerhq/coin-tezos/config";
import { ConfigInfo } from "@ledgerhq/live-config/LiveConfig";

export const tezosConfig: Record<string, ConfigInfo> = {
  config_currency_tezos: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [
          { id: "blockchain_txs", status: "active" },
          { id: "staking_txs", status: "active" },
        ],
      },
      name: "Tezos",
      unit: { name: "XTZ", code: "XTZ", magnitude: 6 },
      baker: {
        url: "https://tezos-bakers.api.live.ledger.com",
      },
      explorer: {
        url: "https://xtz-tzkt-explorer.api.live.ledger.com",
        maxTxQuery: 100,
      },
      node: {
        url: "https://xtz-node.api.live.ledger.com",
      },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 300,
        minEstimatedFees: 300,
      },
    } satisfies TezosCoinConfig,
  },
};
