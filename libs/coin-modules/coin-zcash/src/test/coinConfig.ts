import type { ZcashCoinConfig, ZcashContext } from "../config";
import { zainoEndpoint } from "../constants";

// `.invalid` hosts never resolve: a test that forgets to mock the network fails fast.
export const TEST_CONFIG: ZcashCoinConfig = {
  status: { type: "active" },
  zaino: { url: "https://zaino.test.invalid", timeoutMs: 120_000, batchSize: 5_000 },
  explorer: { url: "https://explorer.test.invalid" },
};

export const testContext: ZcashContext = {
  config: async () => TEST_CONFIG,
  logger: () => {},
};

export const TEST_ZAINO_ENDPOINT = zainoEndpoint(TEST_CONFIG);
