import BigNumber from "bignumber.js";
import { getEstimatedGas } from "../../bridge/getFeesForTransaction";
import { getMaxSendBalance } from "../../bridge/logic";
import prepareTransaction from "../../bridge/prepareTransaction";
import {
  APTOS_DELEGATION_RESERVE_IN_OCTAS,
  DEFAULT_GAS,
  DEFAULT_GAS_PRICE,
  MIN_COINS_ON_SHARES_POOL_IN_OCTAS,
} from "../../constants";
import { AptosAPI } from "../../network";
import type { AptosAccount, Transaction } from "../../types";

jest.mock("../../network");
jest.mock("../../bridge/getFeesForTransaction");
jest.mock("../../bridge/logic");

describe("Aptos prepareTransaction", () => {
  describe("prepareTransaction", () => {
    let account: AptosAccount;
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

    it("should set the amount to max sendable balance using the default gas budget if useAllAmount is true", async () => {
      transaction.recipient = "test-recipient";
      transaction.useAllAmount = true;
      (getMaxSendBalance as jest.Mock).mockReturnValue(new BigNumber(900));
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(10), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);

      expect(getMaxSendBalance).toHaveBeenCalledWith(
        account,
        undefined,
        new BigNumber(DEFAULT_GAS),
        new BigNumber(DEFAULT_GAS_PRICE),
      );
      expect(result.amount.isEqualTo(new BigNumber(900))).toBe(true);
      expect(result.fees?.isEqualTo(DEFAULT_GAS.multipliedBy(DEFAULT_GAS_PRICE))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(DEFAULT_GAS)).toBe(true);
      expect(new BigNumber(result.options.gasUnitPrice).isEqualTo(DEFAULT_GAS_PRICE)).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should estimate gas against a zeroed amount when useAllAmount is true", async () => {
      transaction.recipient = "test-recipient";
      transaction.useAllAmount = true;
      // amount leaked in from a previous step (e.g. the Amount screen storing the prepared max)
      transaction.amount = new BigNumber(900);
      (getMaxSendBalance as jest.Mock).mockReturnValue(new BigNumber(900));
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      await prepareTransaction(account, transaction);

      const [, estimationTransaction] = (getEstimatedGas as jest.Mock).mock.calls.at(-1);
      expect(estimationTransaction.amount.isZero()).toBe(true);
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

    it("should keep the requested amount when staking a certain amount", async () => {
      account.spendableBalance = new BigNumber(2_000_000_000);
      transaction.mode = "stake";
      transaction.recipient = "test-validator";
      transaction.amount = MIN_COINS_ON_SHARES_POOL_IN_OCTAS.plus(100_000_000);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);

      expect(result.amount.isEqualTo(MIN_COINS_ON_SHARES_POOL_IN_OCTAS.plus(100_000_000))).toBe(
        true,
      );
      expect(result.fees?.isEqualTo(new BigNumber(2000))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should stake the max sendable balance minus the delegation reserve when useAllAmount is true", async () => {
      account.spendableBalance = new BigNumber(2_000_000_000);
      transaction.mode = "stake";
      transaction.recipient = "test-validator";
      transaction.useAllAmount = true;
      const maxAmount = new BigNumber(1_999_990_000);
      (getMaxSendBalance as jest.Mock).mockReturnValue(maxAmount);
      (getEstimatedGas as jest.Mock).mockResolvedValue({
        fees: new BigNumber(2000),
        estimate: { maxGasAmount: new BigNumber(200), gasUnitPrice: new BigNumber(10) },
        errors: {},
      });

      const result = await prepareTransaction(account, transaction);

      const [, estimationTransaction] = (getEstimatedGas as jest.Mock).mock.calls.at(-1);
      expect(estimationTransaction.amount.isZero()).toBe(true);
      expect(result.amount.isEqualTo(maxAmount.minus(APTOS_DELEGATION_RESERVE_IN_OCTAS))).toBe(
        true,
      );
      expect(result.fees?.isEqualTo(new BigNumber(2000))).toBe(true);
      expect(new BigNumber(result.options.maxGasAmount).isEqualTo(new BigNumber(200))).toBe(true);
      expect(result.errors).toEqual({});
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
  });
});
