import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "../constants";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import type { TransactionType } from "../types";
import type { AleoCoinConfig } from "../config";
import { estimateFees } from "./estimateFees";

describe("estimateFees", () => {
  const mockConfig = getMockedConfig("testnet");
  const mockFeeByTransactionType = mockConfig.feeByTransactionType;
  const mockFeeSafetyMultiplier = mockConfig.feeSafetyMultiplier;

  it.each([
    TRANSACTION_TYPE.TRANSFER_PUBLIC,
    TRANSACTION_TYPE.TRANSFER_PRIVATE,
    TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE,
    TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC,
  ])("should return correct fee for %s transaction type", (transactionType: TransactionType) => {
    const result = estimateFees({
      configOrCurrencyId: mockConfig,
      transactionType,
    });

    const expected = mockFeeByTransactionType[transactionType] * mockFeeSafetyMultiplier;

    expect(result.value).toEqual(BigInt(expected));
  });

  it("should apply feeSafetyMultiplier correctly and ceil the result", () => {
    const configWithMultiplier: AleoCoinConfig = {
      ...mockConfig,
      feeSafetyMultiplier: 1.5,
    };

    const result = estimateFees({
      configOrCurrencyId: configWithMultiplier,
      transactionType: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    });

    const baseFee = configWithMultiplier.feeByTransactionType[TRANSACTION_TYPE.TRANSFER_PUBLIC];
    const expected = new BigNumber(baseFee)
      .multipliedBy(configWithMultiplier.feeSafetyMultiplier)
      .integerValue(BigNumber.ROUND_CEIL);

    expect(result.value).toEqual(BigInt(expected.toString()));
  });

  it("should throw error for unknown transaction type", () => {
    expect(() =>
      estimateFees({
        configOrCurrencyId: mockConfig,
        // @ts-expect-error - testing invalid input
        transactionType: "UNKNOWN",
      }),
    ).toThrow("aleo: missing fee configuration for UNKNOWN");
  });

  it("should throw error for undefined transaction type", () => {
    expect(() =>
      estimateFees({
        configOrCurrencyId: mockConfig,
        // @ts-expect-error - testing invalid input
        transactionType: undefined,
      }),
    ).toThrow("aleo: missing fee configuration for undefined");
  });
});
