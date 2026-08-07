import type { CasperCoinConfig } from "../../types";

export const casperMainnetConfig: CasperCoinConfig = () => ({
  status: { type: "active" },
  infra: {
    API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
    API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
  },
});
