import type { BoilerplateCoinConfig, BoilerplateContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockBoilerplateConfig: BoilerplateCoinConfig = {
  status: { type: "active" },
  nodeUrl: "https://node.boilerplate.test.invalid",
  minReserve: 0,
  infra: {
    INDEXER_BOILERPLATE: "https://indexer.boilerplate.test.invalid",
    NODE_BOILERPLATE: "https://node.boilerplate.test.invalid",
  },
};

/** A {@link BoilerplateContext} backed by the mocked config, for api tests. */
export const createMockBoilerplateContext = (
  config: BoilerplateCoinConfig = mockBoilerplateConfig,
): BoilerplateContext => ({
  config: async () => config,
  logger: () => {},
});
