import * as cacheModule from "@ledgerhq/live-network/cache";
import { makeBridgeCacheSystem } from "./cache";
import { getCryptoCurrencyById } from "../currencies";
import { setEnv } from "@ledgerhq/live-env";
import { loadMockBridgeForFamily } from "../coin-modules/registry";

const mockBridge = {
  getPreloadStrategy: () => ({ preloadMaxAge: 5 * 60 * 1000 }),
  preload: () => Promise.resolve(null),
  hydrate: () => {},
  scanAccounts: () => ({ subscribe: () => {} }),
};

jest.mock("./impl", () => ({
  ...jest.requireActual("./impl"),
  getCurrencyBridge: jest.fn(),
}));

describe("Bridge Cache", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { getCurrencyBridge } = jest.requireMock("./impl");
    getCurrencyBridge.mockResolvedValue(mockBridge);
  });

  beforeAll(() => {
    setEnv("PLAYWRIGHT_RUN", true);
    // Pre-warm so the solana module's init call to makeLRUCache (makeEstimateMaxSpendable)
    // is not counted by the per-test spies below.
    loadMockBridgeForFamily("solana");
  });

  afterAll(() => {
    setEnv("PLAYWRIGHT_RUN", false);
  });

  it("does not re-generate the LRU cache by default", async () => {
    const makeLRUCache = jest.spyOn(cacheModule, "makeLRUCache");
    const { prepareCurrency } = makeBridgeCacheSystem({
      saveData: () => Promise.resolve(),
      getData: () => Promise.resolve(null),
    });

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);
  }, 10000);

  it("forces the LRU cache to be re-generated", async () => {
    const makeLRUCache = jest.spyOn(cacheModule, "makeLRUCache");
    const { prepareCurrency } = makeBridgeCacheSystem({
      saveData: () => Promise.resolve(),
      getData: () => Promise.resolve(null),
    });

    await prepareCurrency(getCryptoCurrencyById("solana"));
    expect(makeLRUCache).toHaveBeenCalledTimes(1);

    await prepareCurrency(getCryptoCurrencyById("solana"), { forceUpdate: true });
    expect(makeLRUCache).toHaveBeenCalledTimes(2);
  }, 10000);
});
