import type { NearConfig, NearContext } from "../config";
import { NEAR_BASE_URL_MOCKED } from "../network/node.mock";

/** The resolved config every mocked endpoint points at (mirrors {@link setMockCoinConfig}). */
export const mockNearConfig: NearConfig = {
  status: { type: "active" },
  infra: {
    API_NEAR_PRIVATE_NODE: NEAR_BASE_URL_MOCKED,
    API_NEAR_PUBLIC_NODE: NEAR_BASE_URL_MOCKED,
    API_NEAR_INDEXER: NEAR_BASE_URL_MOCKED,
    API_NEARBLOCKS_INDEXER: NEAR_BASE_URL_MOCKED,
  },
};

/** A {@link NearContext} backed by the mocked config, for api tests. */
export const createMockNearContext = (config: NearConfig = mockNearConfig): NearContext => ({
  config: async () => config,
  logger: () => {},
});

/** A ready-to-use {@link NearContext} backed by {@link mockNearConfig}. */
export const mockNearContext: NearContext = createMockNearContext();
