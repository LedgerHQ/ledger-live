import BigNumber from "bignumber.js";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { getMockedAccount, getMockedTokenAccount } from "../test/fixtures/account.fixture";
import {
  getMockedHTSTokenCurrency,
  getTokenCurrencyFromCALByType,
} from "../test/fixtures/currency.fixture";
import { getMockedOperation } from "../test/fixtures/operation.fixture";
import type { HederaOperationExtra } from "../types";
import {
  applyPendingExtras,
  mergeSubAccounts,
  patchOperationWithExtra,
  prepareOperations,
} from "./utils";

describe("bridge utils", () => {
  describe("prepareOperations", () => {
    const tokenCurrencyFromCAL = getTokenCurrencyFromCALByType("hts");

    beforeAll(() => {
      setupMockCryptoAssetsStore({
        findTokenByAddressInCurrency: jest
          .fn()
          .mockImplementation(async () => tokenCurrencyFromCAL),
      });
    });

    it("links token operation to existing coin operation with matching hash", async () => {
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

    it("creates NONE coin operation as parent if no coin op with matching hash exists", async () => {
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
    it("returns newSubAccounts if no initial account exists", () => {
      const mockedTokenCurrency1 = getMockedHTSTokenCurrency({ id: "token1" });
      const mockedTokenCurrency2 = getMockedHTSTokenCurrency({ id: "token2" });
      const mockedTokenAccount1 = getMockedTokenAccount(mockedTokenCurrency1, { id: "ta1" });
      const mockedTokenAccount2 = getMockedTokenAccount(mockedTokenCurrency2, { id: "ta2" });
      const initialAccount = undefined;
      const newSubAccounts = [mockedTokenAccount1, mockedTokenAccount2];

      const result = mergeSubAccounts(initialAccount, newSubAccounts);

      expect(result).toEqual(newSubAccounts);
    });

    it("merges operations and updates only changed fields", () => {
      const mockedTokenCurrency = getMockedHTSTokenCurrency();
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

    it("adds new sub accounts that are not present in initial account", () => {
      const existingToken = getMockedHTSTokenCurrency({ id: "token1" });
      const newToken = getMockedHTSTokenCurrency({ id: "token2" });
      const existingTokenAccount = getMockedTokenAccount(existingToken, { id: "ta1" });
      const newTokenAccount = getMockedTokenAccount(newToken, { id: "ta2" });
      const mockedAccount = getMockedAccount({ subAccounts: [existingTokenAccount] });

      const result = mergeSubAccounts(mockedAccount, [existingTokenAccount, newTokenAccount]);

      expect(result.map(sa => sa.id)).toEqual(["ta1", "ta2"]);
    });
  });

  describe("applyPendingExtras", () => {
    it("merges valid extras from pending operations", () => {
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

    it("returns original operation if no matching pending is found", () => {
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
    it("adds extra to operation and nested sub operations", () => {
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
