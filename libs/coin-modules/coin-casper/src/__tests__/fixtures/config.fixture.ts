import type { CasperCoinConfig } from "../../types/config";

export const getMockedConfig = (
  overrides?: Partial<ReturnType<CasperCoinConfig>>,
): ReturnType<CasperCoinConfig> => ({
  status: { type: "active" },
  infra: {
    API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
    API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
  },
  ...overrides,
});
