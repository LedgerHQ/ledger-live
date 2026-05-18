// Regression tests for the 6 deprecated top-level helpers re-exported from
// live-common. They must keep their pre-bridge-extensions semantics: family
// override when registered, framework default otherwise.

import { BigNumber } from "bignumber.js";
import type { Account, AccountLike, Operation } from "@ledgerhq/types-live";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import { registerCoinModules } from "../coin-modules/registry";
import { isAccountEmpty, clearAccount, getVotesCount } from "../account/helpers";
import {
  isEditableOperation,
  isStuckOperation,
  getStuckAccountAndOperation,
} from "../operation";
import type { CoinModuleLoader } from "../coin-modules/types";

const baseAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    type: "Account",
    id: "acc",
    seedIdentifier: "s",
    derivationMode: "" as Account["derivationMode"],
    index: 0,
    freshAddress: "addr",
    freshAddressPath: "44'/0'/0'/0/0",
    used: true,
    blockHeight: 100,
    balance: new BigNumber(1),
    spendableBalance: new BigNumber(1),
    creationDate: new Date(0),
    lastSyncDate: new Date(1),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    currency: { id: "test", family: "deprecated-helpers-fam" } as Account["currency"],
    unit: { code: "T", name: "T", magnitude: 0 },
    balanceHistoryCache: emptyHistoryCache,
    subAccounts: [],
    swapHistory: [],
    syncHash: undefined,
    starred: false,
    ...overrides,
  }) as Account;

const tokenAccount = (parent: Account): AccountLike =>
  ({
    type: "TokenAccount",
    id: "sub",
    parentId: parent.id,
    token: { parentCurrency: parent.currency },
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  }) as unknown as AccountLike;

const registerExtensions = (family: string, ext: unknown): void => {
  registerCoinModules([
    {
      family,
      loadSetup: () => ({}) as ReturnType<CoinModuleLoader["loadSetup"]>,
      loadBridgeExtensions: () => ext as ReturnType<NonNullable<CoinModuleLoader["loadBridgeExtensions"]>>,
    } as CoinModuleLoader,
  ]);
};

describe("deprecated isAccountEmpty proxy", () => {
  test("falls back to default when family has no extension", () => {
    const a = baseAccount({
      currency: { id: "u", family: "unregistered-empty" } as Account["currency"],
      operationsCount: 0,
      balance: new BigNumber(0),
      subAccounts: [],
    });
    expect(isAccountEmpty(a)).toBe(true);
  });

  test("invokes family extension for Account type", () => {
    const fn = jest.fn(() => true);
    registerExtensions("dep-empty-fam", { isAccountEmpty: fn });
    const a = baseAccount({
      currency: { id: "x", family: "dep-empty-fam" } as Account["currency"],
      operationsCount: 5,
      balance: new BigNumber(1000),
    });
    expect(isAccountEmpty(a)).toBe(true);
    expect(fn).toHaveBeenCalledWith(a);
  });

  test("TokenAccount bypasses family extension and uses default", () => {
    const fn = jest.fn(() => true);
    registerExtensions("dep-empty-tok", { isAccountEmpty: fn });
    const parent = baseAccount({
      currency: { id: "y", family: "dep-empty-tok" } as Account["currency"],
    });
    const sub = tokenAccount(parent);
    expect(isAccountEmpty(sub)).toBe(true); // balance=0, ops=0 → default true
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("deprecated clearAccount proxy", () => {
  test("default path clears operations, blockHeight, lastSyncDate, nfts", () => {
    const a = baseAccount({
      currency: { id: "u2", family: "unregistered-clear" } as Account["currency"],
      operations: [{ id: "op1" } as Operation],
      blockHeight: 999,
      nfts: [{ id: "nft" }] as Account["nfts"],
    });
    const cleared = clearAccount(a);
    expect(cleared.operations).toEqual([]);
    expect(cleared.blockHeight).toBe(0);
    expect(cleared.lastSyncDate.getTime()).toBe(0);
    expect(cleared.nfts).toBeUndefined();
  });

  test("family extension receives the cleared copy", () => {
    const familyClean = jest.fn();
    registerExtensions("dep-clear-fam", {
      clearAccount: <A extends AccountLike>(account: A): A => {
        // mimic Bitcoin pattern: delegate to default then mutate the copy.
        const copy = { ...(account as unknown as Account) } as Account;
        copy.operations = [];
        copy.blockHeight = 0;
        familyClean(copy);
        return copy as unknown as A;
      },
    });
    const a = baseAccount({
      currency: { id: "z", family: "dep-clear-fam" } as Account["currency"],
      operations: [{ id: "op1" } as Operation],
      blockHeight: 555,
    });
    clearAccount(a);
    expect(familyClean).toHaveBeenCalledTimes(1);
  });

  test("TokenAccount path returns a cleared TokenAccount without consulting family", () => {
    const fn = jest.fn();
    registerExtensions("dep-clear-tok", { clearAccount: fn });
    const parent = baseAccount({
      currency: { id: "w", family: "dep-clear-tok" } as Account["currency"],
    });
    const sub = tokenAccount(parent);
    const cleared = clearAccount(sub);
    expect((cleared as { operations: unknown[] }).operations).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("deprecated getVotesCount proxy", () => {
  test("returns 0 when family has no extension", () => {
    const a = baseAccount({
      currency: { id: "u3", family: "unregistered-votes" } as Account["currency"],
    });
    expect(getVotesCount(a)).toBe(0);
  });

  test("delegates to family getStakesCount with main account", () => {
    const fn = jest.fn(() => 7);
    registerExtensions("dep-votes-fam", { getStakesCount: fn });
    const parent = baseAccount({
      currency: { id: "v", family: "dep-votes-fam" } as Account["currency"],
    });
    const sub = tokenAccount(parent);
    // Sub-account → mainAccount resolution gives parent.
    expect(getVotesCount(sub, parent)).toBe(7);
    expect(fn).toHaveBeenCalledWith(parent);
  });
});

describe("deprecated isEditableOperation proxy", () => {
  test("returns false when family has no extension", () => {
    const a = baseAccount({
      currency: { id: "u4", family: "unregistered-editable" } as Account["currency"],
    });
    expect(isEditableOperation({ account: a, operation: {} as Operation })).toBe(false);
  });

  test("delegates to family extension", () => {
    const fn = jest.fn(() => true);
    registerExtensions("dep-edit-fam", { isEditableOperation: fn });
    const a = baseAccount({
      currency: { id: "e", family: "dep-edit-fam" } as Account["currency"],
    });
    const op = { id: "op" } as Operation;
    expect(isEditableOperation({ account: a, operation: op })).toBe(true);
    expect(fn).toHaveBeenCalledWith(a, op);
  });
});

describe("deprecated isStuckOperation proxy", () => {
  test("returns false when family has no extension", () => {
    expect(
      isStuckOperation({ family: "unregistered-stuck", operation: {} as Operation }),
    ).toBe(false);
  });

  test("delegates to family extension with only the operation", () => {
    const fn = jest.fn(() => true);
    registerExtensions("dep-stuck-fam", { isStuckOperation: fn });
    const op = { id: "op" } as Operation;
    expect(isStuckOperation({ family: "dep-stuck-fam", operation: op })).toBe(true);
    expect(fn).toHaveBeenCalledWith(op);
  });
});

describe("deprecated getStuckAccountAndOperation proxy", () => {
  test("returns undefined when family has no extension", () => {
    const a = baseAccount({
      currency: { id: "u5", family: "unregistered-stuck-acc" } as Account["currency"],
    });
    expect(getStuckAccountAndOperation(a, null)).toBeUndefined();
  });

  test("delegates to family extension with (account, parentAccount)", () => {
    const result = { account: {} as AccountLike, parentAccount: undefined, operation: {} as Operation };
    const fn = jest.fn(() => result);
    registerExtensions("dep-stuck-acc-fam", { getStuckAccountAndOperation: fn });
    const parent = baseAccount({
      currency: { id: "k", family: "dep-stuck-acc-fam" } as Account["currency"],
    });
    const sub = tokenAccount(parent);
    expect(getStuckAccountAndOperation(sub, parent)).toBe(result);
    expect(fn).toHaveBeenCalledWith(sub, parent);
  });
});
