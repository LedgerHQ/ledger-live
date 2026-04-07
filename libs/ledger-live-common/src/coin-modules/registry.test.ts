import { CurrencyNotSupported } from "@ledgerhq/errors";
import {
  registerCoinModules,
  getRegisteredFamilies,
  loadSetupForFamily,
  loadTransactionForFamily,
  loadDeviceTxConfigForFamily,
  loadMockBridgeForFamily,
  loadMockAccountForFamily,
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
  currencyIds: [],
  loadSetup: () => Promise.resolve(stubSetup),
  loadTransaction: () => Promise.resolve(stubTxModule),
  ...overrides,
});

describe("registerCoinModules / getRegisteredFamilies", () => {
  it("registers loaders and returns their families", () => {
    registerCoinModules([makeLoader("bitcoin"), makeLoader("evm")]);
    expect(getRegisteredFamilies()).toEqual(expect.arrayContaining(["bitcoin", "evm"]));
  });
});

describe("loadSetupForFamily", () => {
  it("calls the loader's loadSetup", async () => {
    const setup = { bridge: { currencyBridge: {}, accountBridge: {} } } as any;
    registerCoinModules([makeLoader("bitcoin", { loadSetup: () => Promise.resolve(setup) })]);
    expect(await loadSetupForFamily("bitcoin")).toBe(setup);
  });

  it("throws CurrencyNotSupported for unknown family", async () => {
    await expect(loadSetupForFamily("unknown_family")).rejects.toThrow(CurrencyNotSupported);
  });
});

describe("loadTransactionForFamily", () => {
  it("calls the loader's loadTransaction", async () => {
    const txModule = { fromTransactionRaw: jest.fn() } as any;
    registerCoinModules([makeLoader("evm", { loadTransaction: () => Promise.resolve(txModule) })]);
    expect(await loadTransactionForFamily("evm")).toBe(txModule);
  });
});

describe("loadDeviceTxConfigForFamily", () => {
  it("returns the fn when loader has loadDeviceTxConfig", async () => {
    const fn = jest.fn() as any;
    registerCoinModules([makeLoader("bitcoin", { loadDeviceTxConfig: () => Promise.resolve(fn) })]);
    expect(await loadDeviceTxConfigForFamily("bitcoin")).toBe(fn);
  });

  it("returns undefined when loader has no loadDeviceTxConfig", async () => {
    registerCoinModules([makeLoader("evm")]);
    expect(await loadDeviceTxConfigForFamily("evm")).toBeUndefined();
  });

  it("returns undefined for unknown family", async () => {
    expect(await loadDeviceTxConfigForFamily("unknown_family")).toBeUndefined();
  });
});

describe("loadMockBridgeForFamily / loadMockAccountForFamily", () => {
  it("returns undefined for unknown family", async () => {
    expect(await loadMockBridgeForFamily("unknown")).toBeUndefined();
  });

  it("returns undefined when loader has no mock loaders", async () => {
    registerCoinModules([makeLoader("bitcoin")]);
    expect(await loadMockBridgeForFamily("bitcoin")).toBeUndefined();
  });

  it("calls loadMockBridge and loadMockAccount when present", async () => {
    const mockBridge = { currencyBridge: {} as any, accountBridge: {} as any };
    const mockAccount = {};
    registerCoinModules([
      makeLoader("evm", {
        loadMockBridge: () => Promise.resolve(mockBridge),
        loadMockAccount: () => Promise.resolve(mockAccount),
      }),
    ]);
    expect(await loadMockBridgeForFamily("evm")).toBe(mockBridge);
    expect(await loadMockAccountForFamily("evm")).toBe(mockAccount);
  });
});
