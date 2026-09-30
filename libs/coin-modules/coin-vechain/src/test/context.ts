import type { VechainContext, VechainCurrencyConfig } from "../config";

/** The resolved config every mocked endpoint points at. */
export const mockVechainConfig: VechainCurrencyConfig = {
  status: { type: "active" },
  name: "Vechain",
  unit: { name: "VET", code: "VET", magnitude: 18 },
  node: { url: "https://vechain.coin.ledger.com" },
};

/** A {@link VechainContext} backed by the mocked config, for api tests. */
export const createMockVechainContext = (
  config: VechainCurrencyConfig = mockVechainConfig,
): VechainContext => ({
  config: async () => config,
  logger: () => {},
});
