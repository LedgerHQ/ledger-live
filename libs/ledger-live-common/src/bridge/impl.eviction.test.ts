import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";

jest.mock("../coin-modules/registry", () => ({
  ...jest.requireActual("../coin-modules/registry"),
  loadSetupForFamily: jest.fn(),
  loadMockBridgeForFamily: jest.fn(),
  loadBridgeExtensionsForFamily: jest.fn(async () => ({})),
}));

import * as registry from "../coin-modules/registry";
import { getCurrencyBridge, getAccountBridgeByFamily, clearBridgeCache } from "./impl";

const mockedLoad = registry.loadSetupForFamily as jest.Mock;

beforeEach(() => {
  mockedLoad.mockReset();
  clearBridgeCache();
});

describe("impl.ts — family cache behavior on rejection (no auto-eviction)", () => {
  test("currencyBridgePromiseCache MEMOIZES rejection — React.use() would loop without identity stability", async () => {
    const family = "bitcoin";
    mockedLoad.mockImplementation(() => Promise.reject(new Error("chunk load failure")));

    const p1 = getCurrencyBridge(getCryptoCurrencyById(family));
    p1.catch(() => {});
    await expect(p1).rejects.toThrow(/chunk load failure/);
    const p2 = getCurrencyBridge(getCryptoCurrencyById(family));
    p2.catch(() => {});
    await expect(p2).rejects.toThrow(/chunk load failure/);

    expect(p1).toBe(p2);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  test("accountBridgePromiseCache MEMOIZES rejection across calls (same family)", async () => {
    const family = "ethereum";
    mockedLoad.mockImplementation(() => Promise.reject(new Error("chunk load failure")));

    const p1 = getAccountBridgeByFamily(family);
    p1.catch(() => {});
    await expect(p1).rejects.toThrow(/chunk load failure/);
    const p2 = getAccountBridgeByFamily(family);
    p2.catch(() => {});
    await expect(p2).rejects.toThrow(/chunk load failure/);

    expect(p1).toBe(p2);
    expect(mockedLoad).toHaveBeenCalledTimes(1);
  });

  test("clearBridgeCache(family) allows callers to retry after a transient failure", async () => {
    const family = "bitcoin";
    mockedLoad
      .mockImplementationOnce(() => Promise.reject(new Error("transient")))
      .mockImplementationOnce(() =>
        Promise.resolve({
          bridge: {
            currencyBridge: {},
            accountBridge: {},
          },
        }),
      );

    const p1 = getCurrencyBridge(getCryptoCurrencyById(family));
    p1.catch(() => {});
    await expect(p1).rejects.toThrow(/transient/);

    clearBridgeCache(family);

    const p2 = getCurrencyBridge(getCryptoCurrencyById(family));
    await expect(p2).resolves.toBeDefined();
    expect(mockedLoad).toHaveBeenCalledTimes(2);
  });

  test("clearBridgeCache() with no argument clears every family", async () => {
    mockedLoad.mockImplementation(() => Promise.reject(new Error("transient")));

    const p1 = getCurrencyBridge(getCryptoCurrencyById("bitcoin"));
    p1.catch(() => {});
    await expect(p1).rejects.toThrow(/transient/);
    const p2 = getAccountBridgeByFamily("ethereum");
    p2.catch(() => {});
    await expect(p2).rejects.toThrow(/transient/);

    clearBridgeCache();

    mockedLoad.mockImplementation(() =>
      Promise.resolve({ bridge: { currencyBridge: {}, accountBridge: {} } }),
    );
    await expect(getCurrencyBridge(getCryptoCurrencyById("bitcoin"))).resolves.toBeDefined();
    await expect(getAccountBridgeByFamily("ethereum")).resolves.toBeDefined();
  });
});
