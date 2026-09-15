import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { mockTokenCurrency } from "@domain/entity-currency-token/schema.mock";
import type { AccountNamesState } from "@domain/entity-account-name";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { makeEmptyTokenAccount } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { serializeAccount } from "@ledgerhq/wallet-api-core";
import aleoExtensions from "../families/aleo/bridgeExtensions";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import "../__tests__/test-helpers/setup";
import type { Transaction } from "../coin-modules/transaction-types";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountBridge } from "../bridge";
import {
  accountToWalletAPIAccount,
  getWalletAPITransactionSignFlowInfos,
  resolveWalletApiSpendableBalance,
} from "./converters";
import type { WalletAPITransaction } from "./types";

const walletState: AccountNamesState = new Map();

const makeMainAccount = (id: string, readiness?: Account["readiness"]): Account => ({
  ...(genAccount(id, { currency: getCryptoCurrencyById("ethereum") }) as Account),
  readiness,
});

const makeTokenAccount = (parentAccount: Account): TokenAccount =>
  genTokenAccount(0, parentAccount, mockTokenCurrency()) as TokenAccount;

const evmBridge = jest.fn();
const bitcoinBridge = jest.fn();
jest.mock("../coin-modules/registry", () => ({
  loadWalletApiAdapterForFamily: (family: string) => {
    switch (family) {
      case "evm":
        return { getWalletAPITransactionSignFlowInfos: () => evmBridge() };
      case "bitcoin":
        return { getWalletAPITransactionSignFlowInfos: () => bitcoinBridge() };
      default:
        return undefined;
    }
  },
}));

jest.mock("../bridge", () => ({
  getAccountBridge: jest.fn(),
}));

jest.mock("@ledgerhq/logs", () => ({
  ...jest.requireActual("@ledgerhq/logs"),
  log: jest.fn(),
}));

const mockLog = jest.mocked(log);
const mockGetAccountBridge = jest.mocked(getAccountBridge);

describe("getWalletAPITransactionSignFlowInfos", () => {
  beforeEach(() => {
    evmBridge.mockClear();
    bitcoinBridge.mockClear();
  });

  it("should call the bridge if the implementation exists", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "bitcoin",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(bitcoinBridge).toHaveBeenCalledTimes(1);
    expect(evmBridge).toHaveBeenCalledTimes(0);
  });

  it("should call the evm bridge for WalletAPITransaction tx of ethereum family", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "ethereum",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    // When
    await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(1);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
  });

  it("should use its fallback if the bridge doesn't exist", async () => {
    // Given
    const tx: WalletAPITransaction = {
      family: "algorand",
      mode: "send",
      amount: new BigNumber(100000),
      recipient: "0xABCDEF",
    };

    const expectedLiveTx: Partial<Transaction> = {
      family: tx.family,
      mode: "send",
      amount: tx.amount,
      recipient: tx.recipient,
    };

    // When
    const { canEditFees, hasFeesProvided, liveTx } = await getWalletAPITransactionSignFlowInfos({
      walletApiTransaction: tx,
      account: {} as Account,
    });

    // Then
    expect(evmBridge).toHaveBeenCalledTimes(0);
    expect(bitcoinBridge).toHaveBeenCalledTimes(0);
    expect(canEditFees).toBe(false);
    expect(hasFeesProvided).toBe(false);
    expect(liveTx).toEqual(expectedLiveTx);
  });
});

describe("resolveWalletApiSpendableBalance", () => {
  const account = { spendableBalance: new BigNumber(100) } as AccountLike;

  beforeEach(() => {
    mockGetAccountBridge.mockReset();
    mockLog.mockClear();
  });

  it("returns the bridge's getWalletApiSpendableBalance result", async () => {
    // Given
    const bridgeSpendableBalance = new BigNumber(42);

    mockGetAccountBridge.mockResolvedValue({
      getWalletApiSpendableBalance: jest.fn().mockReturnValue(bridgeSpendableBalance),
    } as never);

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(bridgeSpendableBalance);
  });

  it("falls back to account.spendableBalance when the bridge returns undefined", async () => {
    // Given
    mockGetAccountBridge.mockResolvedValue({
      getWalletApiSpendableBalance: jest.fn().mockReturnValue(undefined),
    } as never);

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(account.spendableBalance);
  });

  it("falls back to account.spendableBalance and logs when the bridge lookup fails", async () => {
    // Given
    mockGetAccountBridge.mockRejectedValue(new Error("unsupported family"));

    // When
    const result = await resolveWalletApiSpendableBalance(account);

    // Then
    expect(result).toEqual(account.spendableBalance);
    expect(mockLog).toHaveBeenCalledTimes(1);
    expect(mockLog).toHaveBeenCalledWith(
      "wallet-api/converters",
      expect.stringContaining("falling back to account.spendableBalance"),
      { error: "unsupported family" },
    );
  });
});

// The crash this guards against only shows up once the three real pieces are chained: the family
// extension, the converter funnel, and the wallet-api serializer that calls .toString() on what
// they produce. Each one alone is green. Only the bridge lookup is stubbed, with the real
// extension behind it.
describe("wallet-api serialization of a drawer-built token account", () => {
  it("serializes an Aleo ARC-22 token account that has no sub-account", async () => {
    // Given: what the asset drawer builds for a token the user holds no sub-account for
    const parentAccount = makeMainAccount("aleo-parent");
    const tokenAccount = makeEmptyTokenAccount(
      parentAccount,
      mockTokenCurrency({ parentCurrencyId: getCryptoCurrencyById("aleo").id }),
    );
    mockGetAccountBridge.mockResolvedValue(aleoExtensions as never);

    // When: the account.request / account.list handler shape (see react.ts)
    const spendableBalance = await resolveWalletApiSpendableBalance(tokenAccount, parentAccount);
    const walletApiAccount = {
      ...accountToWalletAPIAccount(walletState, tokenAccount, parentAccount),
      spendableBalance,
    };

    // Then: the real serializer must not blow up on an undefined balance
    expect(() => serializeAccount(walletApiAccount)).not.toThrow();
    expect(serializeAccount(walletApiAccount).spendableBalance).toBe("0");
  });
});

describe("accountToWalletAPIAccount", () => {
  it("passes the account readiness through", () => {
    const account = makeMainAccount("readiness-not-ready", {
      ready: false,
      reason: "unrevealed",
    });

    const walletApiAccount = accountToWalletAPIAccount(walletState, account);

    expect(walletApiAccount.readiness).toEqual({
      ready: false,
      reason: "unrevealed",
    });
  });

  it("leaves readiness undefined when the account has none", () => {
    const account = makeMainAccount("readiness-absent");

    const walletApiAccount = accountToWalletAPIAccount(walletState, account);

    expect(walletApiAccount.readiness).toBeUndefined();
  });

  it("derives a token account's readiness from its parent", () => {
    const parentAccount = makeMainAccount("readiness-parent", {
      ready: false,
      reason: "unrevealed",
    });
    const tokenAccount = makeTokenAccount(parentAccount);

    const walletApiAccount = accountToWalletAPIAccount(walletState, tokenAccount, parentAccount);

    expect(walletApiAccount.readiness).toEqual({
      ready: false,
      reason: "unrevealed",
    });
  });
});
