import { CurrencyLiveConfigDefinition } from "../../config";

const nearConfig: CurrencyLiveConfigDefinition = {
  config_currency_near: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://near.coin.ledger-stg.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.near.org",
        API_NEAR_INDEXER: "https://near.coin.ledger-stg.com/indexer",
      },
    },
  },
};

export { nearConfig };
