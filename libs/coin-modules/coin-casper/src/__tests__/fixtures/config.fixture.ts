import type { CasperCoinConfig, CasperConfig, CasperContext } from "../../types";

export const casperMainnetConfig: CasperCoinConfig = () => ({
  status: { type: "active" },
  infra: {
    API_CASPER_NODE_ENDPOINT: "https://casper.coin.ledger.com/node/",
    API_CASPER_INDEXER: "https://casper.coin.ledger.com/indexer/",
  },
});

/** The resolved config value threaded through the low layers. */
export const casperMainnetResolvedConfig: CasperConfig = casperMainnetConfig();

/** A mock {@link CasperContext} resolving to {@link casperMainnetResolvedConfig}. */
export const createMockContext = (
  config: CasperConfig = casperMainnetResolvedConfig,
): CasperContext => ({
  config: async () => config,
  logger: () => {},
});
