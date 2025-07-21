import { CurrencyLiveConfigDefinition } from "../../config";

export const casperConfig: CurrencyLiveConfigDefinition = {
  config_currency_casper: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      infra: {
        API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
        API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
      },
    },
  },
};
