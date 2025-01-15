import prepareTransaction from "./prepareTransaction";
import { AptosAPI } from "./api";
import { getEstimatedGas } from "./getFeesForTransaction";
import { getMaxSendBalance } from "./logic";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

jest.mock("./api");
jest.mock("./getFeesForTransaction");
jest.mock("./logic");

describe("Aptos prepareTransaction", () => {
  describe("prepareTransaction", () => {
    let account: Account;
    let transaction: Transaction;

    beforeEach(() => {
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
      } as unknown as Account;

      transaction = {
        amount: new BigNumber(0),
        recipient: "",
        useAllAmount: false,
        fees: new BigNumber(0),
        firstEmulation: true,
        options: {},
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
      expect(new BigNumber(result.estimate.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
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
      expect(new BigNumber(result.estimate.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should set firstEmulation to false after the first call", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(10),
        estimate: { maxGasAmount: new BigNumber(200) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(result.firstEmulation).toBe(false);
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
      expect(new BigNumber(result.estimate.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should set maxGasAmount in options", async () => {
      transaction.recipient = "test-recipient";
      transaction.amount = new BigNumber(100);
      transaction.firstEmulation = true;
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);
      expect(new BigNumber(result.estimate.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.firstEmulation).toBe(false);
    });
  });
});
