import { CurrencyLiveConfigDefinition } from "../../config";

const minaConfig: CurrencyLiveConfigDefinition = {
  config_currency_mina: {
    type: "object",
    default: {
      status: { type: "active" },
      infra: {
        API_NEAR_PRIVATE_NODE: "https://mina.coin.ledger.com/node",
        API_NEAR_PUBLIC_NODE: "https://rpc.mainnet.mina.org",
        API_NEAR_INDEXER: "https://mina.coin.ledger.com/indexer",
      },
    },
  },
};

export { minaConfig };
