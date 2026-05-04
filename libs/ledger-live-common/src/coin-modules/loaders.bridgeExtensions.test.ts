// Integration tests: AccountBridge extension methods are properly wired through
// the loader registry — both the loadBridgeExtensions path (alpacaized families:
// evm, tezos) and the setup.bridge path (non-alpacaized families).

jest.mock("@ledgerhq/coin-evm/operation");
jest.mock("@ledgerhq/coin-tezos/network/bakers");
// getCurrencyConfiguration is called by hasGasTracker inside evm/bridgeExtensions.ts
jest.mock("../config", () => ({
  getCurrencyConfiguration: jest.fn(() => ({ gasTracker: { url: "mock" } })),
}));

import {
  isEditableOperation as evmIsEditableOperation,
  isStuckOperation as evmIsStuckOperation,
  getStuckAccountAndOperation as evmGetStuckAccountAndOperation,
} from "@ledgerhq/coin-evm/operation";
import { isAccountDelegating } from "@ledgerhq/coin-tezos/network/bakers";
import type { Account, AccountBridge } from "@ledgerhq/types-live";
import { getAccountBridgeByFamily } from "../bridge/impl";
import { registerCoinModules, loadBridgeExtensionsForFamily } from "./registry";
import { coinModuleLoaders } from "./loaders";

const mockClearAccount = jest.fn(account => account);
const mockIsAccountEmpty = jest.fn(() => true);

beforeAll(() => {
  registerCoinModules([
    ...coinModuleLoaders,
    // Stub loader for non-alpacaized path (clearAccount, isAccountEmpty via setup.bridge)
    {
      family: "__bridge_ext_test__",
      loadSetup: () => ({
        bridge: {
          currencyBridge: {} as any,
          accountBridge: {
            sync: jest.fn() as any,
            receive: jest.fn() as any,
            createTransaction: jest.fn() as any,
            updateTransaction: jest.fn() as any,
            prepareTransaction: jest.fn() as any,
            getTransactionStatus: jest.fn() as any,
            estimateMaxSpendable: jest.fn() as any,
            broadcast: jest.fn() as any,
            signOperation: jest.fn() as any,
            clearAccount: mockClearAccount,
            isAccountEmpty: mockIsAccountEmpty,
          } as unknown as AccountBridge<any>,
        },
      }),
      loadTransaction: () => ({
        fromTransactionRaw: jest.fn(),
        toTransactionRaw: jest.fn(),
        formatTransaction: jest.fn(),
      }),
    },
  ]);
});

const evmAccount = { currency: { id: "ethereum", family: "evm" } } as Account;
const tezosAccount = { currency: { family: "tezos" } } as Account;
const mockOp = {} as any;

// ─── evm: via loadBridgeExtensions ───────────────────────────────────────────

describe("evm bridge extensions (loadBridgeExtensions path)", () => {
  let ext: Partial<AccountBridge<any>>;

  beforeAll(() => {
    ext = loadBridgeExtensionsForFamily("evm");
  });

  it("isEditableOperation delegates to coin-evm with hasGasTracker", () => {
    (evmIsEditableOperation as jest.Mock).mockReturnValue(true);
    expect(ext.isEditableOperation!(evmAccount, mockOp)).toBe(true);
    expect(evmIsEditableOperation).toHaveBeenCalledWith(evmAccount, mockOp, expect.any(Function));
  });

  it("isStuckOperation delegates to coin-evm", () => {
    (evmIsStuckOperation as jest.Mock).mockReturnValue(true);
    expect(ext.isStuckOperation!(mockOp)).toBe(true);
    expect(evmIsStuckOperation).toHaveBeenCalledWith(mockOp);
  });

  it("getStuckAccountAndOperation delegates to coin-evm with hasGasTracker", () => {
    const expected = { account: evmAccount, parentAccount: undefined, operation: mockOp };
    (evmGetStuckAccountAndOperation as jest.Mock).mockReturnValue(expected);
    expect(ext.getStuckAccountAndOperation!(evmAccount, undefined)).toBe(expected);
    expect(evmGetStuckAccountAndOperation).toHaveBeenCalledWith(
      evmAccount,
      undefined,
      expect.any(Function),
    );
  });
});

// ─── tezos: via loadBridgeExtensions ─────────────────────────────────────────

describe("tezos bridge extensions (loadBridgeExtensions path)", () => {
  let ext: Partial<AccountBridge<any>>;

  beforeAll(() => {
    ext = loadBridgeExtensionsForFamily("tezos");
  });

  it("getStakesCount returns 1 when account is delegating", () => {
    (isAccountDelegating as jest.Mock).mockReturnValue(true);
    expect(ext.getStakesCount!(tezosAccount)).toBe(1);
    expect(isAccountDelegating).toHaveBeenCalledWith(tezosAccount);
  });

  it("getStakesCount returns 0 when account is not delegating", () => {
    (isAccountDelegating as jest.Mock).mockReturnValue(false);
    expect(ext.getStakesCount!(tezosAccount)).toBe(0);
  });
});

// ─── non-alpacaized: clearAccount and isAccountEmpty via setup.bridge ────────

describe("non-alpacaized family bridge extensions (setup.bridge path)", () => {
  let bridge: AccountBridge<any>;
  const account = { type: "Account", subAccounts: [] } as any;

  beforeAll(() => {
    bridge = getAccountBridgeByFamily("__bridge_ext_test__");
  });

  it("clearAccount is provided by the family setup bridge", () => {
    bridge.clearAccount!(account);
    expect(mockClearAccount).toHaveBeenCalledWith(account);
  });

  it("isAccountEmpty is provided by the family setup bridge", () => {
    expect(bridge.isAccountEmpty!(account)).toBe(true);
    expect(mockIsAccountEmpty).toHaveBeenCalledWith(account);
  });
});
