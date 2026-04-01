/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { BigNumber } from "bignumber.js";
import { renderHook } from "tests/testSetup";
import { DustLimit, FeeTooHigh } from "@ledgerhq/errors";
import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import { useAmountScreenMessage } from "../useAmountScreenMessage";
import { useTranslatedBridgeError } from "../../../Recipient/hooks/useTranslatedBridgeError";

jest.mock("../../../Recipient/hooks/useTranslatedBridgeError");

const mockedUseTranslatedBridgeError = jest.mocked(useTranslatedBridgeError);

function createStatus(overrides?: Partial<TransactionStatus>): TransactionStatus {
  return {
    amount: new BigNumber(100),
    estimatedFees: new BigNumber(0),
    errors: {},
    warnings: {},
    ...overrides,
  } as TransactionStatus;
}

describe("useAmountScreenMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslatedBridgeError.mockImplementation((error?: Error) =>
      error ? { title: error.name, description: "" } : null,
    );
  });

  it("prioritizes blocking errors (e.g. dustLimit) over fee-too-high info", () => {
    const dustLimitError = new DustLimit();

    const { result } = renderHook(() =>
      useAmountScreenMessage({
        status: createStatus({
          errors: { dustLimit: dustLimitError },
          warnings: { feeTooHigh: new FeeTooHigh() },
        }),
        accountCurrency: undefined,
        amountComputationPending: false,
        hasRawAmount: true,
      }),
    );

    expect(result.current.amountMessage).toEqual({
      type: "error",
      text: "DustLimit",
    });
  });

  it("shows fee-too-high as info when no blocking error exists", () => {
    const feeTooHigh = new FeeTooHigh();

    const { result } = renderHook(() =>
      useAmountScreenMessage({
        status: createStatus({
          warnings: { feeTooHigh },
        }),
        accountCurrency: undefined,
        amountComputationPending: false,
        hasRawAmount: true,
      }),
    );

    expect(result.current.amountMessage).toEqual({
      type: "info",
      text: "FeeTooHigh",
    });
  });
});
