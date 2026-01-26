import { BigNumber } from "bignumber.js";
import * as estimateMaxSpendableModule from "./estimateMaxSpendable";
import * as getFeesModule from "./getFeesForTransaction";
import { prepareTransaction } from "./prepareTransaction";
import type { AlgorandAccount, Transaction } from "./types";

jest.mock("./estimateMaxSpendable");
jest.mock("./getFeesForTransaction");

const mockEstimateMaxSpendable =
  estimateMaxSpendableModule.estimateMaxSpendable as jest.MockedFunction<
    typeof estimateMaxSpendableModule.estimateMaxSpendable
  >;

const mockGetEstimatedFees = getFeesModule.getEstimatedFees as jest.MockedFunction<
  typeof getFeesModule.getEstimatedFees
>;

describe("prepareTransaction", () => {
  const mockAccount = {
    id: "algorand-account-1",
    freshAddress: "ALGO_FRESH_ADDRESS",
    algorandResources: {
      rewards: new BigNumber("0"),
      nbAssets: 0,
    },
  } as unknown as AlgorandAccount;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEstimatedFees.mockResolvedValue(new BigNumber("1000"));
    mockEstimateMaxSpendable.mockResolvedValue(new BigNumber("9000000"));
  });

  describe("send mode", () => {
    it("should prepare transaction with provided amount", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        useAllAmount: false,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.amount.toString()).toBe("1000000");
      expect(result.recipient).toBe("RECIPIENT_ADDRESS");
      expect(result.fees).toBeInstanceOf(BigNumber);
      expect(result.fees?.toString()).toBe("1000");
    });

    it("should calculate max amount when useAllAmount is true", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("0"),
        recipient: "RECIPIENT_ADDRESS",
        fees: null,
        useAllAmount: true,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.amount.toString()).toBe("9000000");
      expect(mockEstimateMaxSpendable).toHaveBeenCalled();
    });

    it("should preserve recipient from transaction", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("500000"),
        recipient: "CUSTOM_RECIPIENT",
        fees: null,
        useAllAmount: false,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.recipient).toBe("CUSTOM_RECIPIENT");
    });
  });

  describe("optIn mode", () => {
    it("should set recipient to freshAddress and amount to 0", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "optIn",
        amount: new BigNumber("100"),
        recipient: "SOME_ADDRESS",
        fees: null,
        assetId: "algorand/asa/12345",
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.recipient).toBe("ALGO_FRESH_ADDRESS");
      expect(result.amount.toString()).toBe("0");
    });

    it("should calculate fees for optIn", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "optIn",
        amount: new BigNumber("0"),
        recipient: "",
        fees: null,
        assetId: "algorand/asa/12345",
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.fees?.toString()).toBe("1000");
      expect(mockGetEstimatedFees).toHaveBeenCalled();
    });
  });

  describe("claimReward mode", () => {
    it("should set recipient to freshAddress and amount to 0", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "claimReward",
        amount: new BigNumber("100"),
        recipient: "SOME_ADDRESS",
        fees: null,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result.recipient).toBe("ALGO_FRESH_ADDRESS");
      expect(result.amount.toString()).toBe("0");
    });
  });

  describe("unsupported mode", () => {
    it("should throw error for unsupported mode", async () => {
      const transaction = {
        family: "algorand",
        mode: "unsupported" as Transaction["mode"],
        amount: new BigNumber("0"),
        recipient: "",
        fees: null,
      } as Transaction;

      await expect(prepareTransaction(mockAccount, transaction)).rejects.toThrow(
        "Unsupported transaction mode",
      );
    });
  });

  describe("transaction caching", () => {
    it("should return same transaction if nothing changed", async () => {
      const fees = new BigNumber("1000");
      mockGetEstimatedFees.mockResolvedValue(fees);

      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees,
        useAllAmount: false,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result).toBe(transaction);
    });

    it("should return new transaction if fees changed", async () => {
      const transaction: Transaction = {
        family: "algorand",
        mode: "send",
        amount: new BigNumber("1000000"),
        recipient: "RECIPIENT_ADDRESS",
        fees: new BigNumber("500"), // Different from mock
        useAllAmount: false,
      };

      const result = await prepareTransaction(mockAccount, transaction);

      expect(result).not.toBe(transaction);
      expect(result.fees?.toString()).toBe("1000");
    });
  });
});
