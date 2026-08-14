import type { MultiversXCoinConfig, MultiversXContext } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockMultiversXConfig: MultiversXCoinConfig = {
  status: { type: "active" },
  apiEndpoint: "https://api.multiversx.com",
  delegationApiEndpoint: "https://delegation-api.multiversx.com",
};

/** A {@link MultiversXContext} backed by the mocked config, for api tests. */
export const createMockMultiversXContext = (
  config: MultiversXCoinConfig = mockMultiversXConfig,
): MultiversXContext => ({
  config: async () => config,
  logger: () => {},
});
