import type { AlgorandCoinConfig, AlgorandContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockAlgorandConfig: AlgorandCoinConfig = {
  status: { type: "active" },
  infra: { API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT: "https://algo.test" },
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
