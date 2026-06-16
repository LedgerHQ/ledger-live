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
        hasRawAmount: true,
      }),
    );

    expect(result.current.amountMessage).toEqual({
      type: "error",
      text: "DustLimit",
      error: dustLimitError,
    });
    expect(result.current.isAmountInputDisabled).toBe(false);
  });

  it("shows fee-too-high as info when no blocking error exists", () => {
    const feeTooHigh = new FeeTooHigh();

    const { result } = renderHook(() =>
      useAmountScreenMessage({
        status: createStatus({
          warnings: { feeTooHigh },
        }),
        hasRawAmount: true,
      }),
    );

    expect(result.current.amountMessage).toEqual({
      type: "info",
      text: "FeeTooHigh",
      error: feeTooHigh,
    });
    expect(result.current.isAmountInputDisabled).toBe(false);
  });

  it("shows an input-blocking recipient error and disables the amount input", () => {
    const recipientError = new Error("");
    recipientError.name = "SourceHasMultiSign";

    const { result } = renderHook(() =>
      useAmountScreenMessage({
        status: createStatus({
          errors: { recipient: recipientError },
        }),
        hasRawAmount: false,
      }),
    );

    expect(result.current.amountMessage).toEqual({
      type: "error",
      text: "SourceHasMultiSign",
      error: recipientError,
    });
    expect(result.current.isAmountInputDisabled).toBe(true);
  });
});
