import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { CeloConfigInfo } from "../config";

/** The resolved config every mocked endpoint points at: suites mock the network, so these hosts
 * never reach a real server. */
export const mockCeloConfig: CeloConfigInfo = {
  status: { type: "active" },
  chainId: 42220,
  name: "Celo",
  node: { type: "external", uri: "https://celo-node.test.invalid" },
  explorer: { type: "etherscan", uri: "https://celo-explorer.test.invalid" },
  infra: { API_CELO_INDEXER: "https://celo-indexer.test.invalid" },
};

/** The production config the integration suites run against. */
export const mainnetCeloConfig: CeloConfigInfo = {
  status: { type: "active" },
  chainId: 42220,
  name: "Celo",
  node: { type: "external", uri: "https://celo.coin.ledger.com/archive" },
  explorer: { type: "etherscan", uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42220" },
  infra: { API_CELO_INDEXER: "https://celo.coin.ledger.com/indexer/" },
};

/** A Celo api context backed by the given config. */
export const createMockCeloContext = (
  config: CeloConfigInfo = mockCeloConfig,
): Context<CeloConfigInfo> => ({
  config: async () => config,
  logger: () => {},
});
