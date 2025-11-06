import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { setupCalClientStore } from "@ledgerhq/live-common/test-helpers/cryptoAssetsStore";
import { HEDERA_OPERATION_TYPES, HEDERA_TRANSACTION_MODES } from "../constants";
import { estimateFees } from "../logic/estimateFees";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import { getMockedTokenCurrency, getTokenCurrencyFromCAL } from "../test/fixtures/currency.fixture";
import { getMockedTransaction } from "../test/fixtures/transaction.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import { getMockedMirrorToken } from "../test/fixtures/mirror.fixture";
import type { HederaOperationExtra } from "../types";
import {
  applyPendingExtras,
  calculateAmount,
  getSubAccounts,
  mergeSubAccounts,
  patchOperationWithExtra,
  prepareOperations,
} from "./utils";

describe("utils", () => {
  beforeAll(() => {
    setupCalClientStore();
  });

  describe("calculateAmount", () => {
    let estimatedFees: Record<"crypto" | "associate", BigNumber>;

    beforeAll(async () => {
      const mockedAccount = getMockedAccount();
      const [crypto, associate] = await Promise.all([
        estimateFees(mockedAccount.currency, HEDERA_OPERATION_TYPES.CryptoTransfer),
        estimateFees(mockedAccount.currency, HEDERA_OPERATION_TYPES.TokenAssociate),
      ]);

      estimatedFees = { crypto, associate };
    });

    test("HBAR transfer, useAllAmount = true", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({ useAllAmount: true });

      const amount = mockedAccount.balance.minus(estimatedFees.crypto);
      const totalSpent = amount.plus(estimatedFees.crypto);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    test("HBAR transfer, useAllAmount = false", async () => {
      const mockedAccount = getMockedAccount();
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1000000),
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.crypto);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    test("token transfer, useAllAmount = true", async () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: true,
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTokenAccount.balance;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    test("token transfer, useAllAmount = false", async () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        subAccountId: mockedTokenAccount.id,
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount;

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });

    test("token associate operation uses TokenAssociate fee", async () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedTokenAccount = getMockedTokenAccount(mockedTokenCurrency);
      const mockedAccount = getMockedAccount({ subAccounts: [mockedTokenAccount] });
      const mockedTransaction = getMockedTransaction({
        useAllAmount: false,
        amount: new BigNumber(1),
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate,
        properties: {
          token: mockedTokenCurrency,
        },
      });

      const amount = mockedTransaction.amount;
      const totalSpent = amount.plus(estimatedFees.associate);

      const result = await calculateAmount({
        account: mockedAccount,
        transaction: mockedTransaction,
      });

      expect(result).toEqual({ amount, totalSpent });
    });
  });

  describe("getSubAccounts", () => {
    test("returns sub account based on operations and mirror tokens", async () => {
      const firstTokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const secondTokenCurrencyFromCAL = getTokenCurrencyFromCAL(1);
      const mockedAccount = getMockedAccount();
      const mockedMirrorToken1 = getMockedMirrorToken({
        token_id: firstTokenCurrencyFromCAL.contractAddress,
        balance: 10,
      });
      const mockedMirrorToken2 = getMockedMirrorToken({
        token_id: secondTokenCurrencyFromCAL.contractAddress,
        balance: 0,
      });

      const mockedOperation1 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, firstTokenCurrencyFromCAL),
      });
      const mockedOperation2 = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, secondTokenCurrencyFromCAL),
      });

      const result = await getSubAccounts(
        mockedAccount.id,
        [mockedOperation1, mockedOperation2],
        [mockedMirrorToken1, mockedMirrorToken2],
      );
      const uniqueSubAccountIds = new Set(result.map(sa => sa.id));

      expect(result).toHaveLength(2);
      expect(result[0].token).toEqual(firstTokenCurrencyFromCAL);
      expect(result[1].token).toEqual(secondTokenCurrencyFromCAL);
      expect(result[0].balance).toEqual(new BigNumber(10));
      expect(result[1].balance).toEqual(new BigNumber(0));
      expect(result[0].operations).toEqual([mockedOperation1]);
      expect(result[1].operations).toEqual([mockedOperation2]);
      expect(uniqueSubAccountIds.size).toBe(result.length);
    });

    test("ignores operation if token is not listed in CAL", async () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const mockedAccount = getMockedAccount();
      const mockedOperation = getMockedOperation({
        accountId: encodeTokenAccountId(mockedAccount.id, mockedTokenCurrency),
      });

      const result = await getSubAccounts(mockedAccount.id, [mockedOperation], []);

      expect(result).toHaveLength(0);
    });

    test("returns sub account for mirror token with no operations yet (e.g. right after association)", async () => {
      const tokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);
      const mockedAccount = getMockedAccount();
      const mockedMirrorToken = getMockedMirrorToken({
        token_id: tokenCurrencyFromCAL.contractAddress,
        balance: 42,
      });

      const result = await getSubAccounts(mockedAccount.id, [], [mockedMirrorToken]);

      expect(result).toHaveLength(1);
      expect(result[0].token).toEqual(tokenCurrencyFromCAL);
      expect(result[0].operations).toHaveLength(0);
      expect(result[0].balance).toEqual(new BigNumber(42));
    });
  });

  describe("prepareOperations", () => {
    const tokenCurrencyFromCAL = getTokenCurrencyFromCAL(0);

    test("links token operation to existing coin operation with matching hash", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedCoinOperation = getMockedOperation({ hash: "shared" });
      const mockedTokenOperation = getMockedOperation({
        hash: "shared",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([mockedCoinOperation], [mockedTokenOperation]);

      expect(result).toHaveLength(1);
      expect(result[0].subOperations).toEqual([mockedTokenOperation]);
    });

    test("creates NONE coin operation as parent if no coin op with matching hash exists", async () => {
      const mockedTokenAccount = getMockedTokenAccount(tokenCurrencyFromCAL);
      const mockedOrphanTokenOperation = getMockedOperation({
        hash: "unknown-hash",
        accountId: encodeTokenAccountId(mockedTokenAccount.parentId, tokenCurrencyFromCAL),
      });

      const result = await prepareOperations([], [mockedOrphanTokenOperation]);
      const noneOp = result.find(op => op.type === "NONE");

      expect(typeof noneOp).toBe("object");
      expect(noneOp).not.toBeNull();
      expect(noneOp?.subOperations?.[0]).toEqual(mockedOrphanTokenOperation);
      expect(noneOp?.hash).toBe("unknown-hash");
    });
  });

  describe("mergeSubAccounts", () => {
    test("returns newSubAccounts if no initial account exists", () => {
      const mockedTokenCurrency1 = getMockedTokenCurrency({ id: "token1" });
      const mockedTokenCurrency2 = getMockedTokenCurrency({ id: "token2" });
      const mockedTokenAccount1 = getMockedTokenAccount(mockedTokenCurrency1, { id: "ta1" });
      const mockedTokenAccount2 = getMockedTokenAccount(mockedTokenCurrency2, { id: "ta2" });
      const initialAccount = undefined;
      const newSubAccounts = [mockedTokenAccount1, mockedTokenAccount2];

      const result = mergeSubAccounts(initialAccount, newSubAccounts);

      expect(result).toEqual(newSubAccounts);
    });

    test("merges operations and updates only changed fields", () => {
      const mockedTokenCurrency = getMockedTokenCurrency();
      const existingOperation = getMockedOperation({ id: "op1" });
      const newOperation = getMockedOperation({ id: "op2" });
      const newPendingOperation = getMockedOperation({ id: "op3" });
      const existingTokenAccount = getMockedTokenAccount(mockedTokenCurrency, {
        id: "tokenaccount",
        balance: new BigNumber(1000),
        creationDate: new Date(),
        operations: [existingOperation],
        pendingOperations: [],
      });
      const updatedTokenAccount = getMockedTokenAccount(mockedTokenCurrency, {
        id: "tokenaccount",
        balance: new BigNumber(2000),
        creationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        operations: [newOperation],
        pendingOperations: [newPendingOperation],
      });
      const mockedAccount = getMockedAccount({ subAccounts: [existingTokenAccount] });

      const result = mergeSubAccounts(mockedAccount, [updatedTokenAccount]);
      const merged = result[0];

      expect(result).toHaveLength(1);
      expect(merged.creationDate).toEqual(existingTokenAccount.creationDate);
      expect(merged.balance).toEqual(new BigNumber(2000));
      expect(merged.pendingOperations.map(op => op.id)).toEqual(["op3"]);
      expect(merged.operations.map(op => op.id)).toEqual(["op2", "op1"]);
      expect(merged.operationsCount).toEqual(2);
    });

    test("adds new sub accounts that are not present in initial account", () => {
      const existingToken = getMockedTokenCurrency({ id: "token1" });
      const newToken = getMockedTokenCurrency({ id: "token2" });
      const existingTokenAccount = getMockedTokenAccount(existingToken, { id: "ta1" });
      const newTokenAccount = getMockedTokenAccount(newToken, { id: "ta2" });
      const mockedAccount = getMockedAccount({ subAccounts: [existingTokenAccount] });

      const result = mergeSubAccounts(mockedAccount, [existingTokenAccount, newTokenAccount]);

      expect(result.map(sa => sa.id)).toEqual(["ta1", "ta2"]);
    });
  });

  describe("applyPendingExtras", () => {
    test("merges valid extras from pending operations", () => {
      const opExtra1: HederaOperationExtra = { consensusTimestamp: "1.2.3.4" };
      const pendingExtra1: HederaOperationExtra = { associatedTokenId: "0.0.1234" };

      const mockedOperation1 = getMockedOperation({ hash: "op1", extra: opExtra1 });
      const mockedPendingOperation1 = getMockedOperation({ hash: "op1", extra: pendingExtra1 });

      const result = applyPendingExtras([mockedOperation1], [mockedPendingOperation1]);

      expect(result).toHaveLength(1);
      expect(result[0].extra).toEqual({
        ...mockedOperation1.extra,
        ...mockedPendingOperation1.extra,
      });
    });

    test("returns original operation if no matching pending is found", () => {
      const opExtra: HederaOperationExtra = { consensusTimestamp: "1.2.3.4" };
      const pendingExtra: HederaOperationExtra = { associatedTokenId: "0.0.1234" };

      const mockedOperation = getMockedOperation({ hash: "unknown", extra: opExtra });
      const mockedPendingOperation = getMockedOperation({ hash: "op1", extra: pendingExtra });

      const result = applyPendingExtras([mockedOperation], [mockedPendingOperation]);
      expect(result).toHaveLength(1);
      expect(result[0].extra).toEqual(mockedOperation.extra);
    });
  });

  describe("patchOperationWithExtra", () => {
    test("adds extra to operation and nested sub operations", () => {
      const mockedOperation = getMockedOperation({
        hash: "parent",
        extra: {},
        subOperations: [getMockedOperation({ hash: "sub1", extra: {} })],
      });

      const extra: HederaOperationExtra = {
        consensusTimestamp: "12345",
        associatedTokenId: "0.0.1001",
      };

      const patched = patchOperationWithExtra(mockedOperation, extra);

      expect(patched.extra).toEqual(extra);
      expect(patched.subOperations).toHaveLength(1);
      expect(patched.subOperations?.[0].extra).toEqual(extra);
    });
  });
});
