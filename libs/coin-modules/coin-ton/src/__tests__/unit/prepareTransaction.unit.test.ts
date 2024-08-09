import { toNano } from "@ton/core";
import BigNumber from "bignumber.js";
import { estimateFee, fetchAccountInfo } from "../../bridge/bridgeHelpers/api";
import { TOKEN_TRANSFER_MAX_FEE } from "../../constants";
import prepareTransaction from "../../prepareTransaction";
import {
  account,
  accountInfo,
  transaction as baseTransaction,
  fees,
  jettonTransaction,
  totalFees,
} from "../fixtures/common.fixtures";

jest.mock("../../bridge/bridgeHelpers/api");

describe("prepareTransaction", () => {
  beforeAll(() => {
    const fetchAccountInfoMock = jest.mocked(fetchAccountInfo);
    fetchAccountInfoMock.mockReturnValue(Promise.resolve(accountInfo));
    const fetchEstimateFeeMock = jest.mocked(estimateFee);
    fetchEstimateFeeMock.mockReturnValue(Promise.resolve(fees));
  });

  describe("Ton Transaction", () => {
    it("should return the transaction with the updated amount and fees", async () => {
      const transaction = await prepareTransaction(account, baseTransaction);

      expect(transaction).toEqual({
        ...baseTransaction,
        fees: totalFees,
      });
    });

    it("should preserve the reference when no change is detected on the transaction", async () => {
      const transaction = await prepareTransaction(account, { ...baseTransaction });
      const transaction2 = await prepareTransaction(account, transaction);

      expect(transaction).toBe(transaction2);
    });

    it("should create a coin transaction using the spendableBalance in the account", async () => {
      const transaction = await prepareTransaction(account, {
        ...baseTransaction,
        useAllAmount: true,
      });

      expect(transaction).toEqual({
        ...baseTransaction,
        useAllAmount: true,
        fees: totalFees,
        amount: account.spendableBalance.minus(totalFees),
      });
    });
  });

  describe("Jetton Transaction", () => {
    it("should return the transaction with the updated amount and fees", async () => {
      const transaction = await prepareTransaction(account, jettonTransaction);

      expect(transaction).toEqual({
        ...jettonTransaction,
        fees: new BigNumber(toNano(TOKEN_TRANSFER_MAX_FEE).toString()),
      });
    });

    it("should preserve the reference when no change is detected on the transaction", async () => {
      const transaction = await prepareTransaction(account, { ...jettonTransaction });
      const transaction2 = await prepareTransaction(account, transaction);

      expect(transaction).toBe(transaction2);
    });

    it("should create a coin transaction using the spendableBalance in the account", async () => {
      const transaction = await prepareTransaction(account, {
        ...jettonTransaction,
        useAllAmount: true,
      });

      expect(transaction).toEqual({
        ...jettonTransaction,
        useAllAmount: true,
        fees: new BigNumber(toNano(TOKEN_TRANSFER_MAX_FEE).toString()),
        amount: account.subAccounts?.[0].spendableBalance,
      });
    });
  });
});
