import BigNumber from "bignumber.js";
import { getEstimatedGas } from "../../bridge/getFeesForTransaction";
import { getMaxSendBalance } from "../../bridge/logic";
import prepareTransaction from "../../bridge/prepareTransaction";
import { AptosAPI } from "../../network";

import type { AptosAccount, Transaction } from "../../types";
import {
  createFixtureAccountWithSubAccount,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";

jest.mock("../../network");
jest.mock("../../bridge/getFeesForTransaction");
jest.mock("../../bridge/logic");

describe("Aptos prepareTransaction", () => {
  describe("prepareTransaction", () => {
    let account: AptosAccount;
    let transaction: Transaction;

    beforeEach(() => {
      jest.clearAllMocks();
      account = {
        id: "test-account-id",
        name: "Test Account",
        currency: {
          id: "aptos",
          name: "Aptos",
          ticker: "APT",
          units: [{ name: "Aptos", code: "APT", magnitude: 6 }],
        },
        spendableBalance: new BigNumber(1000),
        balance: new BigNumber(1000),
        blockHeight: 0,
        operations: [],
        pendingOperations: [],
        unit: { code: "APT", name: "Aptos", magnitude: 6 },
        lastSyncDate: new Date(),
        subAccounts: [],
      } as unknown as AptosAccount;

      transaction = {
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
        fees: new BigNumber(0),
        mode: "send",
      } as Transaction;
    });

    it("should return the transaction if recipient is not set", async () => {
      const result = await prepareTransaction(account, transaction);
      expect(result).toEqual(transaction);
    });

    it("should return the transaction with zero fees if amount is zero and useAllAmount is false", async () => {
      transaction.recipient = "test-recipient";
      const result = await prepareTransaction(account, transaction);
      expect(result.fees?.isZero()).toBe(true);
    });

    it("should set the amount to max sendable balance if useAllAmount is true", async () => {
      transaction.recipient = "test-recipient";
      transaction.useAllAmount = true;
      (getMaxSendBalance as jest.Mock).mockReturnValue(new BigNumber(900));
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(result.amount.isEqualTo(new BigNumber(900))).toBe(true);
      expect(result.fees?.isEqualTo(new BigNumber(2000))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should call getEstimatedGas and set the transaction fees, estimate, and errors", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(10),
        estimate: { maxGasAmount: new BigNumber(200) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(getEstimatedGas).toHaveBeenCalledWith(account, transaction, expect.any(AptosAPI));
      expect(result.fees?.isEqualTo(new BigNumber(10))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should return the transaction with updated fees and estimate if recipient is set and amount is not zero", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(result.fees?.isEqualTo(new BigNumber(2000))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should set maxGasAmount in options", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
    });

    it("should return the transaction with fees null when getEstimatedGas throws", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      (getEstimatedGas as jest.Mock).mockRejectedValue(new Error("gas estimation failed"));

      const result = await prepareTransaction(account, transaction);

      expect(result).toEqual({
        ...transaction,
        fees: null,
      });
    });

    it("should estimate fees for native APT send when amount is within native APT balance", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(500); // send amount (500) < native balance (1000)

      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(20_000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(100) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);

      expect(result.fees?.isEqualTo(new BigNumber(20_000))).toBe(true);
    });

    it("should skip fee estimation for native APT send when amount exceeds native APT balance", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(2000); // send amount (2000) > native balance (1000)

      await prepareTransaction(account, transaction);

      expect(getEstimatedGas).not.toHaveBeenCalled();
    });

    it("should estimate fees for token send when amount (in raw units) is within token balance — even if it exceeds native APT balance", async () => {
      const account = createFixtureAccountWithSubAccount("coin");
      account.spendableBalance = new BigNumber(100_000);
      account.subAccounts![0].spendableBalance = new BigNumber(300_000);

      const transaction = createFixtureTransactionWithSubAccount();
      transaction.recipient = "test-recipient";
      // native balance (100_000) < send amount (200_000) < token balance (300_000)
      transaction.amount = new BigNumber(200_000);

      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(20_000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(100) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);

      expect(result.fees?.isEqualTo(new BigNumber(20_000))).toBe(true);
    });

    it("should skip fee estimation for token send when amount (in raw units) exceeds token balance — even if it is within native APT balance", async () => {
      const account = createFixtureAccountWithSubAccount("coin");
      account.spendableBalance = new BigNumber(300_000);
      account.subAccounts![0].spendableBalance = new BigNumber(100_000);

      const transaction = createFixtureTransactionWithSubAccount();
      transaction.recipient = "test-recipient";
      // token balance (100_000) < send amount (200_000) < native balance (300_000)
      transaction.amount = new BigNumber(200_000);

      await prepareTransaction(account, transaction);

      expect(getEstimatedGas).not.toHaveBeenCalled();
    });
  });
});
