import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE, feesByTransactionType, ESTIMATED_FEE_SAFETY_RATE } from "../constants";
import { estimateFees } from "./estimateFees";

describe("estimateFees", () => {
  const mockFeesByTransactionType = feesByTransactionType;
  const mockSafetyRate = ESTIMATED_FEE_SAFETY_RATE;

  it("should return correct fee for TRANSFER_PUBLIC transaction type", async () => {
    const result = await estimateFees({
      feesByTransactionType: mockFeesByTransactionType,
      transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
      estimatedFeeSafetyRate: mockSafetyRate,
    });

    expect(result).toBeInstanceOf(BigNumber);
    expect(result.toNumber()).toEqual(
      mockFeesByTransactionType[TRANSACTION_TYPE.TRANSFER_PUBLIC] * mockSafetyRate,
    );
  });

  it("should return correct fee for CONVERT_PUBLIC_TO_PRIVATE transaction type", async () => {
    const result = await estimateFees({
      feesByTransactionType: mockFeesByTransactionType,
      transactionType: TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
      estimatedFeeSafetyRate: mockSafetyRate,
    });

    expect(result).toBeInstanceOf(BigNumber);
    expect(result.toNumber()).toEqual(
      mockFeesByTransactionType[TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE] * mockSafetyRate,
    );
  });

  it("should return correct fee for TRANSFER_PRIVATE transaction type", async () => {
    const result = await estimateFees({
      feesByTransactionType: mockFeesByTransactionType,
      transactionType: TRANSACTION_TYPE.TRANSFER_PRIVATE,
      estimatedFeeSafetyRate: mockSafetyRate,
    });

    expect(result).toBeInstanceOf(BigNumber);
    expect(result.toNumber()).toEqual(
      mockFeesByTransactionType[TRANSACTION_TYPE.TRANSFER_PRIVATE] * mockSafetyRate,
    );
  });

  it("should return correct fee for CONVERT_PRIVATE_TO_PUBLIC transaction type", async () => {
    const result = await estimateFees({
      feesByTransactionType: mockFeesByTransactionType,
      transactionType: TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
      estimatedFeeSafetyRate: mockSafetyRate,
    });

    expect(result).toBeInstanceOf(BigNumber);
    expect(result.toNumber()).toEqual(
      mockFeesByTransactionType[TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC] * mockSafetyRate,
    );
  });

  it("should throw error for unknown transaction type", async () => {
    await expect(
      estimateFees({
        feesByTransactionType: mockFeesByTransactionType,
        transactionType: "UNKNOWN" as TRANSACTION_TYPE,
        estimatedFeeSafetyRate: mockSafetyRate,
      }),
    ).rejects.toThrow("aleo: missing fee configuration for UNKNOWN");
  });

  it("should throw error for undefined transaction type", async () => {
    await expect(
      estimateFees({
        feesByTransactionType: mockFeesByTransactionType,
        transactionType: undefined as any,
        estimatedFeeSafetyRate: mockSafetyRate,
      }),
    ).rejects.toThrow("aleo: missing fee configuration for undefined");
  });
});
