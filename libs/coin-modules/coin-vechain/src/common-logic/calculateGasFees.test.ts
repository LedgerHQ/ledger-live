import BigNumber from "bignumber.js";
import { calculateGasFees } from "./calculateGasFees";
import { Transaction } from "../types";
import { parseAddress } from "./parseAddress";
import { calculateClausesVet, calculateClausesVtho } from "./calculateClauses";
import { estimateGas } from "./estimateGas";
import { getThorClient } from "./getThorClient";

// Mock all dependencies
jest.mock("./parseAddress");
jest.mock("./calculateClauses");
jest.mock("./estimateGas");
jest.mock("./getThorClient");

const mockedParseAddress = jest.mocked(parseAddress);
const mockedCalculateClausesVet = jest.mocked(calculateClausesVet);
const mockedCalculateClausesVtho = jest.mocked(calculateClausesVtho);
const mockedEstimateGas = jest.mocked(estimateGas);
const mockedGetThorClient = jest.mocked(getThorClient);

describe("calculateGasFees", () => {
  const mockTransaction: Transaction = {
    family: "vechain",
    recipient: "0x1234567890123456789012345678901234567890",
    amount: new BigNumber("1000000000000000000"), // 1 VET/VTHO
    estimatedFees: "0",
    body: {},
  } as Transaction;

  const mockOriginAddress = "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4";

  const mockClauses = [
    {
      to: "0x1234567890123456789012345678901234567890",
      value: "1000000000000000000",
      data: "0x",
    },
  ];

  const mockGasEstimation = {
    totalGas: 21000,
    reverted: false,
    revertReasons: [],
    vmErrors: [],
  };

  const mockThorClient = {
    transactions: {
      buildTransactionBody: jest.fn(),
    },
  };

  const mockTransactionBody = {
    maxFeePerGas: "20000000000", // 20 gwei
    maxPriorityFeePerGas: "1000000000", // 1 gwei
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mocks
    mockedGetThorClient.mockReturnValue(mockThorClient as any);
    mockThorClient.transactions.buildTransactionBody.mockResolvedValue(mockTransactionBody);
  });

  describe("Valid VET transactions (isTokenAccount = false)", () => {
    beforeEach(() => {
      mockedParseAddress.mockReturnValue(true);
      mockedCalculateClausesVet.mockResolvedValue(mockClauses);
      mockedEstimateGas.mockResolvedValue(mockGasEstimation);
    });

    it("should calculate gas fees for VET transfer", async () => {
      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(mockedParseAddress).toHaveBeenCalledWith(mockTransaction.recipient);
      expect(mockedCalculateClausesVet).toHaveBeenCalledWith(
        mockTransaction.recipient,
        mockTransaction.amount,
      );
      expect(mockedCalculateClausesVtho).not.toHaveBeenCalled();
      expect(mockedEstimateGas).toHaveBeenCalledWith(mockClauses, mockOriginAddress);
      expect(mockThorClient.transactions.buildTransactionBody).toHaveBeenCalledWith(
        mockClauses,
        mockGasEstimation.totalGas,
        {},
      );

      expect(result).toEqual({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("420000000000000"), // 21000 * 20000000000
        maxFeePerGas: 20000000000,
        maxPriorityFeePerGas: 1000000000,
      });
    });

    it("should handle transaction body with null gas values", async () => {
      mockThorClient.transactions.buildTransactionBody.mockResolvedValue({
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("0"), // 21000 * 0
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should handle transaction body with undefined gas values", async () => {
      mockThorClient.transactions.buildTransactionBody.mockResolvedValue({});

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("0"), // 21000 * 0
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should handle different gas estimation values", async () => {
      const customGasEstimation = {
        totalGas: 50000,
        reverted: false,
        revertReasons: [],
        vmErrors: [],
      };
      mockedEstimateGas.mockResolvedValue(customGasEstimation);

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 50000,
        estimatedGasFees: new BigNumber("1000000000000000"), // 50000 * 20000000000
        maxFeePerGas: 20000000000,
        maxPriorityFeePerGas: 1000000000,
      });
    });
  });

  describe("Valid VTHO transactions (isTokenAccount = true)", () => {
    beforeEach(() => {
      mockedParseAddress.mockReturnValue(true);
      mockedCalculateClausesVtho.mockResolvedValue(mockClauses);
      mockedEstimateGas.mockResolvedValue(mockGasEstimation);
    });

    it("should calculate gas fees for VTHO transfer", async () => {
      const result = await calculateGasFees(mockTransaction, true, mockOriginAddress);

      expect(mockedParseAddress).toHaveBeenCalledWith(mockTransaction.recipient);
      expect(mockedCalculateClausesVtho).toHaveBeenCalledWith(
        mockTransaction.recipient,
        mockTransaction.amount,
      );
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
      expect(mockedEstimateGas).toHaveBeenCalledWith(mockClauses, mockOriginAddress);
      expect(mockThorClient.transactions.buildTransactionBody).toHaveBeenCalledWith(
        mockClauses,
        mockGasEstimation.totalGas,
        {},
      );

      expect(result).toEqual({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("420000000000000"), // 21000 * 20000000000
        maxFeePerGas: 20000000000,
        maxPriorityFeePerGas: 1000000000,
      });
    });

    it("should handle large amounts correctly", async () => {
      const largeAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber("999999999999999999999999"),
      };

      const result = await calculateGasFees(largeAmountTransaction, true, mockOriginAddress);

      expect(mockedCalculateClausesVtho).toHaveBeenCalledWith(
        largeAmountTransaction.recipient,
        largeAmountTransaction.amount,
      );
      expect(result.estimatedGas).toBe(21000);
      expect(result.estimatedGasFees).toEqual(new BigNumber("420000000000000"));
    });
  });

  describe("Invalid recipient scenarios", () => {
    it("should return zero values when recipient is undefined", async () => {
      const transactionWithoutRecipient = {
        ...mockTransaction,
        recipient: undefined,
      } as any;

      const result = await calculateGasFees(transactionWithoutRecipient, false, mockOriginAddress);

      expect(mockedParseAddress).not.toHaveBeenCalled();
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
      expect(mockedCalculateClausesVtho).not.toHaveBeenCalled();
      expect(mockedEstimateGas).not.toHaveBeenCalled();

      expect(result).toEqual({
        estimatedGas: 0,
        estimatedGasFees: new BigNumber(0),
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should return zero values when recipient is null", async () => {
      const transactionWithNullRecipient = {
        ...mockTransaction,
        recipient: null,
      } as any;

      const result = await calculateGasFees(transactionWithNullRecipient, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 0,
        estimatedGasFees: new BigNumber(0),
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should return zero values when parseAddress returns null/undefined", async () => {
      mockedParseAddress.mockReturnValue(false);

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(mockedParseAddress).toHaveBeenCalledWith(mockTransaction.recipient);
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
      expect(mockedCalculateClausesVtho).not.toHaveBeenCalled();
      expect(mockedEstimateGas).not.toHaveBeenCalled();

      expect(result).toEqual({
        estimatedGas: 0,
        estimatedGasFees: new BigNumber(0),
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });

    it("should return zero values when parseAddress returns empty string", async () => {
      mockedParseAddress.mockReturnValue(false);

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 0,
        estimatedGasFees: new BigNumber(0),
        maxFeePerGas: 0,
        maxPriorityFeePerGas: 0,
      });
    });
  });

  describe("Error handling", () => {
    beforeEach(() => {
      mockedParseAddress.mockReturnValue(true);
    });

    it("should throw error when calculateClausesVet fails", async () => {
      const error = new Error("Failed to calculate VET clauses");
      mockedCalculateClausesVet.mockRejectedValue(error);

      await expect(calculateGasFees(mockTransaction, false, mockOriginAddress)).rejects.toThrow(
        "Failed to calculate VET clauses",
      );
    });

    it("should throw error when calculateClausesVtho fails", async () => {
      const error = new Error("Failed to calculate VTHO clauses");
      mockedCalculateClausesVtho.mockRejectedValue(error);

      await expect(calculateGasFees(mockTransaction, true, mockOriginAddress)).rejects.toThrow(
        "Failed to calculate VTHO clauses",
      );
    });

    it("should throw error when estimateGas fails", async () => {
      mockedCalculateClausesVet.mockResolvedValue(mockClauses);
      const error = new Error("Failed to estimate gas");
      mockedEstimateGas.mockRejectedValue(error);

      await expect(calculateGasFees(mockTransaction, false, mockOriginAddress)).rejects.toThrow(
        "Failed to estimate gas",
      );
    });

    it("should throw error when buildTransactionBody fails", async () => {
      mockedCalculateClausesVet.mockResolvedValue(mockClauses);
      mockedEstimateGas.mockResolvedValue(mockGasEstimation);
      const error = new Error("Failed to build transaction body");
      mockThorClient.transactions.buildTransactionBody.mockRejectedValue(error);

      await expect(calculateGasFees(mockTransaction, false, mockOriginAddress)).rejects.toThrow(
        "Failed to build transaction body",
      );
    });
  });

  describe("Edge cases", () => {
    beforeEach(() => {
      mockedParseAddress.mockReturnValue(true);
      mockedCalculateClausesVet.mockResolvedValue(mockClauses);
      mockedEstimateGas.mockResolvedValue(mockGasEstimation);
    });

    it("should handle zero amount transactions", async () => {
      const zeroAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber("0"),
      };

      const result = await calculateGasFees(zeroAmountTransaction, false, mockOriginAddress);

      expect(mockedCalculateClausesVet).toHaveBeenCalledWith(
        zeroAmountTransaction.recipient,
        new BigNumber("0"),
      );
      expect(result.estimatedGas).toBe(21000);
    });

    it("should handle zero gas estimation", async () => {
      mockedEstimateGas.mockResolvedValue({
        totalGas: 0,
        reverted: false,
        revertReasons: [],
        vmErrors: [],
      });

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 0,
        estimatedGasFees: new BigNumber("0"), // 0 * 20000000000
        maxFeePerGas: 20000000000,
        maxPriorityFeePerGas: 1000000000,
      });
    });

    it("should handle very high gas prices", async () => {
      const highGasTransactionBody = {
        maxFeePerGas: "1000000000000", // 1000 gwei
        maxPriorityFeePerGas: "100000000000", // 100 gwei
      };
      mockThorClient.transactions.buildTransactionBody.mockResolvedValue(highGasTransactionBody);

      const result = await calculateGasFees(mockTransaction, false, mockOriginAddress);

      expect(result).toEqual({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("21000000000000000"), // 21000 * 1000000000000
        maxFeePerGas: 1000000000000,
        maxPriorityFeePerGas: 100000000000,
      });
    });
  });
});
