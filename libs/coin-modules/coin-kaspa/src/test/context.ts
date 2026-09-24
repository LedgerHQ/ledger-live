import type { KaspaCoinConfig, KaspaContext } from "../config";

/**
 * Test host the mocked config points the network layer at, so MSW handlers intercept the exact URL
 * it builds (and a unit test that forgets to mock `fetch` never reaches a real server).
 */
export const TEST_KASPA_ENDPOINT = "https://kaspa-test.ledger.com";

/** The resolved config every mocked endpoint points at. */
export const mockKaspaConfig: KaspaCoinConfig = {
  status: { type: "active" },
  infra: { API_KASPA_ENDPOINT: TEST_KASPA_ENDPOINT },
};

/** The production config the integration suites run against. */
export const mainnetKaspaConfig: KaspaCoinConfig = {
  status: { type: "active" },
  infra: { API_KASPA_ENDPOINT: "https://kaspa.coin.ledger.com" },
};

/** A {@link KaspaContext} backed by the mocked config, for api tests. */
export const createMockKaspaContext = (
  config: KaspaCoinConfig = mockKaspaConfig,
): KaspaContext => ({
  config: async () => config,
  logger: () => {},
});
