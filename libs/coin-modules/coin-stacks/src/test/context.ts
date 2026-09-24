import type { StacksContext, StacksCurrencyConfig } from "../config";

// Test host the mocked config points the network layer at, so MSW handlers intercept the exact URL
// `network/api.ts`'s `getStacksURL` builds (and a unit test that forgets to mock the network never
// reaches a real server).
export const TEST_STACKS_ENDPOINT = "https://stacks.test.invalid";

/** The resolved config every mocked endpoint points at. */
export const mockStacksConfig: StacksCurrencyConfig = {
  status: { type: "active" },
  infra: { API_STACKS_ENDPOINT: TEST_STACKS_ENDPOINT },
};

/** The production config the integration suites run against. */
export const mainnetStacksConfig: StacksCurrencyConfig = {
  status: { type: "active" },
  infra: { API_STACKS_ENDPOINT: "https://stacks.coin.ledger.com" },
};

/** A {@link StacksContext} backed by the mocked config, for api tests. */
export const createMockStacksContext = (
  config: StacksCurrencyConfig = mockStacksConfig,
): StacksContext => ({
  config: async () => config,
  logger: () => {},
});
