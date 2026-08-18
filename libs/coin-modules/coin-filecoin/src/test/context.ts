import type { FilecoinCoinConfig, FilecoinContext } from "../config";

/** The resolved config every mocked endpoint points at (mirrors {@link setCoinConfig}). */
export const mockFilecoinConfig: FilecoinCoinConfig = {
  status: { type: "active" },
};

/** A {@link FilecoinContext} backed by the mocked config, for api tests. */
export const createMockFilecoinContext = (
  config: FilecoinCoinConfig = mockFilecoinConfig,
): FilecoinContext => ({
  config: async () => config,
  logger: () => {},
});
