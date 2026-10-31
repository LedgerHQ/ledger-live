import { coinModuleLoaders } from "../../coin-modules/loaders";
import { registerCoinModules, resetCoinModulesForTests } from "../../coin-modules/registry";
import { getCoinModuleApi } from "../../bridge/generic-coin-framework/api";

// A cosmos family with no local loader would fall back silently to the network module.
jest.mock("../../bridge/generic-coin-framework/api/network/network-coin-service", () => ({
  getNetworkCoinModuleApi: jest.fn(() => {
    throw new Error("the network coin module must not be used for cosmos");
  }),
}));

describe("cosmos coin module resolution", () => {
  beforeAll(() => registerCoinModules(coinModuleLoaders));
  afterAll(() => resetCoinModulesForTests());

  it.each(["cosmos", "osmosis", "injective", "babylon", "dydx", "secret_network"])(
    "resolves %s to the local coin module",
    async currencyId => {
      const api = await getCoinModuleApi(currencyId, "local");

      expect(typeof api.validateIntent).toBe("function");
      expect(typeof api.craftTransaction).toBe("function");
    },
  );
});
