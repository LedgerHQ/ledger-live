import { CurrencyNotSupported } from "@ledgerhq/errors";
import {
  registerCoinModules,
  getRegisteredFamilies,
  loadSetupForFamily,
  loadTransactionForFamily,
  hasDeviceTxConfigForFamily,
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
  loadSetup: () => stubSetup,
  loadTransaction: () => stubTxModule,
  ...overrides,
});

describe("registerCoinModules / getRegisteredFamilies", () => {
  it("registers loaders and returns their families", () => {
    registerCoinModules([makeLoader("bitcoin"), makeLoader("evm")]);
    expect(getRegisteredFamilies()).toEqual(expect.arrayContaining(["bitcoin", "evm"]));
  });
});

describe("loadSetupForFamily", () => {
  it("calls the loader's loadSetup", () => {
    const setup = { bridge: { currencyBridge: {}, accountBridge: {} } } as any;
    registerCoinModules([makeLoader("bitcoin", { loadSetup: () => setup })]);
    expect(loadSetupForFamily("bitcoin")).toBe(setup);
  });

  it("throws CurrencyNotSupported for unknown family", () => {
    expect(() => loadSetupForFamily("unknown_family")).toThrow(CurrencyNotSupported);
  });
});

describe("loadTransactionForFamily", () => {
  it("calls the loader's loadTransaction", () => {
    const txModule = { fromTransactionRaw: jest.fn() } as any;
    registerCoinModules([makeLoader("evm", { loadTransaction: () => txModule })]);
    expect(loadTransactionForFamily("evm")).toBe(txModule);
  });
});

describe("hasDeviceTxConfigForFamily", () => {
  it("returns true when loader has loadDeviceTxConfig", () => {
    registerCoinModules([makeLoader("bitcoin", { loadDeviceTxConfig: () => jest.fn() as any })]);
    expect(hasDeviceTxConfigForFamily("bitcoin")).toBe(true);
  });

  it("returns false when loader has no loadDeviceTxConfig", () => {
    registerCoinModules([makeLoader("evm")]);
    expect(hasDeviceTxConfigForFamily("evm")).toBe(false);
  });

  it("returns false for unknown family", () => {
    expect(hasDeviceTxConfigForFamily("unknown_family")).toBe(false);
  });
});

describe("loadMockBridgeForFamily / loadMockAccountForFamily", () => {
  it("returns undefined for unknown family", () => {
    expect(loadMockBridgeForFamily("unknown")).toBeUndefined();
    expect(loadMockAccountForFamily("unknown")).toBeUndefined();
  });

  it("returns undefined when loader has no mock loaders", () => {
    registerCoinModules([makeLoader("bitcoin")]);
    expect(loadMockBridgeForFamily("bitcoin")).toBeUndefined();
    expect(loadMockAccountForFamily("bitcoin")).toBeUndefined();
  });

  it("calls loadMockBridge and loadMockAccount when present", () => {
    const mockBridge = { currencyBridge: {} as any, accountBridge: {} as any };
    const mockAccount = {};
    registerCoinModules([
      makeLoader("evm", {
        loadMockBridge: () => mockBridge,
        loadMockAccount: () => mockAccount,
      }),
    ]);
    expect(loadMockBridgeForFamily("evm")).toBe(mockBridge);
    expect(loadMockAccountForFamily("evm")).toBe(mockAccount);
  });
});
