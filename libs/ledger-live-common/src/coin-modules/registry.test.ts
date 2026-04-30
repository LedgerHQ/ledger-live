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
  loadIsAccountEmptyForFamily,
  loadGetVotesCountForFamily,
  loadClearAccountForFamily,
  loadValidateAddressForFamily,
  loadIsEditableOperationForFamily,
  loadIsStuckOperationForFamily,
  loadGetStuckAccountAndOperationForFamily,
  loadSignerForFamily,
} from "./registry";
import type { CoinModuleLoader, FamilySetup, TransactionModule } from "./types";

const stubSetup: FamilySetup = {};
const stubTxModule: TransactionModule = {
  fromTransactionRaw: jest.fn(),
  toTransactionRaw: jest.fn(),
  formatTransaction: jest.fn(),
};

const makeLoader = (family: string, overrides: Partial<CoinModuleLoader> = {}): CoinModuleLoader => ({
  family,
  loadSetup: () => Promise.resolve(stubSetup),
  loadTransaction: () => Promise.resolve(stubTxModule),
  ...overrides,
});

describe("registerCoinModules / getRegisteredFamilies", () => {
  it("registers loaders and returns their families", () => {
    registerCoinModules([makeLoader("__regtest_a__"), makeLoader("__regtest_b__")]);
    expect(getRegisteredFamilies()).toEqual(expect.arrayContaining(["__regtest_a__", "__regtest_b__"]));
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
  { loaderKey: "loadIsAccountEmpty", fn: loadIsAccountEmptyForFamily },
  { loaderKey: "loadGetVotesCount", fn: loadGetVotesCountForFamily },
  { loaderKey: "loadClearAccount", fn: loadClearAccountForFamily },
  { loaderKey: "loadValidateAddress", fn: loadValidateAddressForFamily },
  { loaderKey: "loadIsEditableOperation", fn: loadIsEditableOperationForFamily },
  { loaderKey: "loadIsStuckOperation", fn: loadIsStuckOperationForFamily },
  { loaderKey: "loadGetStuckAccountAndOperation", fn: loadGetStuckAccountAndOperationForFamily },
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

  it("caches rejected Promises", async () => {
    const loader = jest.fn(() => Promise.reject(new Error("fail")));
    const cached = makeLoaderCache(loader);
    const p1 = cached("bitcoin");
    const p2 = cached("bitcoin");
    expect(p1).toBe(p2);
    expect(loader).toHaveBeenCalledTimes(1);
    await expect(p1).rejects.toThrow("fail");
  });
});
