import { CurrencyNotSupported } from "@ledgerhq/errors";
import {
  registerCoinModules,
  getRegisteredFamilies,
  makeLoaderCache,
  loadSetupForFamily,
  loadTransactionForFamily,
  loadDeviceTxConfigForFamily,
  loadWalletApiAdapterForFamily,
  loadPlatformAdapterForFamily,
  loadAccountModuleForFamily,
  loadMockBridgeForFamily,
  loadMockAccountForFamily,
  loadValidateAddressForFamily,
  loadSignerForFamily,
  loadBridgeExtensionsForFamily,
} from "./registry";
import type { CoinModuleLoader, FamilySetup, TransactionModule } from "./types";

const stubSetup: FamilySetup = {};
const stubTxModule: TransactionModule = {
  fromTransactionRaw: jest.fn(),
  toTransactionRaw: jest.fn(),
  formatTransaction: jest.fn(),
};

const makeLoader = (
  family: string,
  overrides: Partial<CoinModuleLoader> = {},
): CoinModuleLoader => ({
  family,
  loadSetup: () => Promise.resolve(stubSetup),
  loadTransaction: () => Promise.resolve(stubTxModule),
  ...overrides,
});

describe("registerCoinModules / getRegisteredFamilies", () => {
  it("registers loaders and returns their families", () => {
    registerCoinModules([makeLoader("__regtest_a__"), makeLoader("__regtest_b__")]);
    expect(getRegisteredFamilies()).toEqual(
      expect.arrayContaining(["__regtest_a__", "__regtest_b__"]),
    );
  });
});

type LoaderEntry = {
  loaderKey: keyof CoinModuleLoader;
  fn: (family: string) => unknown;
  required?: true;
};

const allLoaders: LoaderEntry[] = [
  { loaderKey: "loadSetup", fn: loadSetupForFamily, required: true },
  { loaderKey: "loadTransaction", fn: loadTransactionForFamily, required: true },
  { loaderKey: "loadDeviceTxConfig", fn: loadDeviceTxConfigForFamily },
  { loaderKey: "loadWalletApiAdapter", fn: loadWalletApiAdapterForFamily },
  { loaderKey: "loadPlatformAdapter", fn: loadPlatformAdapterForFamily },
  { loaderKey: "loadAccount", fn: loadAccountModuleForFamily },
  { loaderKey: "loadMockBridge", fn: loadMockBridgeForFamily },
  { loaderKey: "loadMockAccount", fn: loadMockAccountForFamily },
  { loaderKey: "loadValidateAddress", fn: loadValidateAddressForFamily },
  { loaderKey: "loadSigner", fn: loadSignerForFamily },
];

describe.each(allLoaders)("$fn.name", ({ loaderKey, fn, required }) => {
  it("returns module when loader has it", async () => {
    const stub = jest.fn();
    registerCoinModules([makeLoader("__test__", { [loaderKey]: () => Promise.resolve(stub) })]);
    expect(await fn("__test__")).toBe(stub);
  });
  it("returns the same Promise reference on repeated calls (memoized)", () => {
    registerCoinModules([makeLoader("__memo__", { [loaderKey]: () => Promise.resolve({}) })]);
    expect(fn("__memo__")).toBe(fn("__memo__"));
  });
  if (required) {
    it("throws CurrencyNotSupported for unknown family", () => {
      expect(() => fn("__none__")).toThrow(CurrencyNotSupported);
    });
  } else {
    it("returns undefined for unknown family", () => {
      expect(fn("__none__")).toBeUndefined();
    });
    it("returns undefined when loader exists but method is absent", () => {
      registerCoinModules([makeLoader("__bare__")]);
      expect(fn("__bare__")).toBeUndefined();
    });
  }
});

describe("loadBridgeExtensionsForFamily", () => {
  it("resolves to extensions when loader has them", async () => {
    const ext = { isAccountEmpty: jest.fn(() => true) };
    registerCoinModules([
      makeLoader("__ext__", { loadBridgeExtensions: () => Promise.resolve(ext) }),
    ]);
    await expect(loadBridgeExtensionsForFamily("__ext__")).resolves.toBe(ext);
  });
  it("resolves to empty object for unknown family", async () => {
    await expect(loadBridgeExtensionsForFamily("__none-ext__")).resolves.toEqual({});
  });
  it("resolves to empty object when loader exists but loadBridgeExtensions is absent", async () => {
    registerCoinModules([makeLoader("__bare2__")]);
    await expect(loadBridgeExtensionsForFamily("__bare2__")).resolves.toEqual({});
  });
});

describe("makeLoaderCache", () => {
  it("always returns the same Promise reference for a given family", () => {
    const loader = jest.fn(() => Promise.resolve(42));
    const cached = makeLoaderCache(loader);
    const p1 = cached("bitcoin");
    const p2 = cached("bitcoin");
    expect(p1).toBe(p2);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("returns different Promises for different families", () => {
    const cached = makeLoaderCache(() => Promise.resolve(1));
    expect(cached("bitcoin")).not.toBe(cached("ethereum"));
  });

  it("does not cache undefined — calls loader again on next call", () => {
    const loader = jest.fn((): Promise<number> | undefined => undefined);
    const cached = makeLoaderCache(loader);
    expect(cached("bitcoin")).toBeUndefined();
    expect(cached("bitcoin")).toBeUndefined();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("memoizes in-flight rejected Promises (same reference until settled)", async () => {
    const loader = jest.fn(() => Promise.reject(new Error("fail")));
    const cached = makeLoaderCache(loader);
    const p1 = cached("bitcoin");
    const p2 = cached("bitcoin");
    expect(p1).toBe(p2);
    expect(loader).toHaveBeenCalledTimes(1);
    await expect(p1).rejects.toThrow("fail");
  });

  it("evicts rejected Promises so the next call retries (transient failure recovery)", async () => {
    let attempt = 0;
    const loader = jest.fn(() => {
      attempt++;
      return attempt === 1 ? Promise.reject(new Error("blip")) : Promise.resolve(42);
    });
    const cached = makeLoaderCache(loader);
    await expect(cached("bitcoin")).rejects.toThrow("blip");
    await expect(cached("bitcoin")).resolves.toBe(42);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
