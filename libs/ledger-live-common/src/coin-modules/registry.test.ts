import { CurrencyNotSupported } from "@ledgerhq/errors";
import {
  registerCoinModules,
  getRegisteredFamilies,
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

const makeLoader = (family: string, overrides: Partial<CoinModuleLoader> = {}): CoinModuleLoader => ({
  family,
  loadSetup: () => stubSetup,
  loadTransaction: () => stubTxModule,
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
  { loaderKey: "loadValidateAddress", fn: loadValidateAddressForFamily },
  { loaderKey: "loadSigner", fn: loadSignerForFamily },
];

describe.each(allLoaders)("$fn.name", ({ loaderKey, fn, required }) => {
  it("returns module when loader has it", () => {
    const stub = jest.fn();
    registerCoinModules([makeLoader("__test__", { [loaderKey]: () => stub })]);
    expect(fn("__test__")).toBe(stub);
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
  it("returns extensions when loader has them", () => {
    const ext = { isAccountEmpty: jest.fn(() => true) };
    registerCoinModules([makeLoader("__ext__", { loadBridgeExtensions: () => ext })]);
    expect(loadBridgeExtensionsForFamily("__ext__")).toBe(ext);
  });
  it("returns empty object for unknown family", () => {
    expect(loadBridgeExtensionsForFamily("__none__")).toEqual({});
  });
  it("returns empty object when loader exists but loadBridgeExtensions is absent", () => {
    registerCoinModules([makeLoader("__bare2__")]);
    expect(loadBridgeExtensionsForFamily("__bare2__")).toEqual({});
  });
});
