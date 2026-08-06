import type { CasperCoinConfig } from "../../types";

const CASPER_MAINNET_INFRA = {
  API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
  API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
};

export const casperMainnetConfig: CasperCoinConfig = () => ({
  status: { type: "active" },
  infra: CASPER_MAINNET_INFRA,
});
