import type { AlgorandCoinConfig, AlgorandContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockAlgorandConfig: AlgorandCoinConfig = {
  status: { type: "active" },
  node: "https://algo.test/ps2/v2",
  indexer: "https://algo.test/idx2/v2",
};

/** An {@link AlgorandContext} backed by the mocked config, for api/logic tests. */
export const createMockAlgorandContext = (
  config: AlgorandCoinConfig = mockAlgorandConfig,
): AlgorandContext => ({
  config: async () => config,
  logger: () => {},
});

/** A ready-to-use {@link AlgorandContext} backed by {@link mockAlgorandConfig}. */
export const mockAlgorandContext: AlgorandContext = createMockAlgorandContext();
