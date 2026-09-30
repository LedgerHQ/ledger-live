import type { Logger } from "@ledgerhq/coin-module-framework/config";
import type { BitcoinCoinConfig, BitcoinContext } from "../../config";

// `.invalid` hosts never resolve: a test that forgets to mock the network fails fast.
export const TEST_CONFIG: BitcoinCoinConfig = {
  status: { type: "active" },
  name: "Bitcoin",
  unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
  explorer: { url: "https://explorer.test.invalid" },
};

export const TEST_LOGGER: Logger = () => {};

export const testContext: BitcoinContext = {
  config: async () => TEST_CONFIG,
  logger: TEST_LOGGER,
};

/** A {@link testContext} whose coin config is {@link TEST_CONFIG} merged with `overrides`. */
export const contextWith = (overrides: Partial<BitcoinCoinConfig>): BitcoinContext => ({
  ...testContext,
  config: async () => ({ ...TEST_CONFIG, ...overrides }),
});
