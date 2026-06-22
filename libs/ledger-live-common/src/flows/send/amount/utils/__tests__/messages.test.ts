import {
  type AmountScreenStatus,
  getAmountScreenMessage,
  getAmountScreenRawMessage,
  isAmountInputDisabledByRecipientError,
} from "../messages";

function createNamedError(name: string): Error {
  const error = new Error("");
  error.name = name;
  return error;
}

function createStatus(overrides?: Partial<AmountScreenStatus>): AmountScreenStatus {
  return {
    errors: {},
    warnings: {},
    ...overrides,
  };
}

describe("getAmountScreenMessage", () => {
  it("returns error message when amountErrorTitle and hasRawAmount are true", () => {
    const result = getAmountScreenMessage({
      amountErrorTitle: "Amount too high",
      hasRawAmount: true,
      isFeeTooHigh: false,
    });

    expect(result).toEqual({
      type: "error",
      text: "Amount too high",
    });
  });

  it("returns null when amountErrorTitle exists but hasRawAmount is false", () => {
    const result = getAmountScreenMessage({
      amountErrorTitle: "Amount too high",
      hasRawAmount: false,
      isFeeTooHigh: false,
    });

    expect(result).toBeNull();
  });

  it("returns warning message when amountWarningTitle exists, hasRawAmount is true, and isFeeTooHigh is false", () => {
    const result = getAmountScreenMessage({
      amountWarningTitle: "Amount is high",
      hasRawAmount: true,
      isFeeTooHigh: false,
    });

    expect(result).toEqual({
      type: "warning",
      text: "Amount is high",
    });
  });

  it("returns info message when amountWarningTitle exists, hasRawAmount is true, and isFeeTooHigh is true", () => {
    const result = getAmountScreenMessage({
      amountWarningTitle: "Amount is high",
      hasRawAmount: true,
      isFeeTooHigh: true,
    });

    expect(result).toEqual({
      type: "info",
      text: "Amount is high",
    });
  });

  it("returns null when amountWarningTitle exists but hasRawAmount is false", () => {
    const result = getAmountScreenMessage({
      amountWarningTitle: "Amount is high",
      hasRawAmount: false,
      isFeeTooHigh: false,
    });

    expect(result).toBeNull();
  });

  it("prioritizes error over warning", () => {
    const result = getAmountScreenMessage({
      amountErrorTitle: "Amount too high",
      amountWarningTitle: "Amount is high",
      hasRawAmount: true,
      isFeeTooHigh: false,
    });

    expect(result).toEqual({
      type: "error",
      text: "Amount too high",
    });
  });

  it("returns null when no titles are provided", () => {
    const result = getAmountScreenMessage({
      hasRawAmount: true,
      isFeeTooHigh: false,
    });

    expect(result).toBeNull();
  });

  it("returns null when hasRawAmount is false even with both titles", () => {
    const result = getAmountScreenMessage({
      amountErrorTitle: "Amount too high",
      amountWarningTitle: "Amount is high",
      hasRawAmount: false,
      isFeeTooHigh: false,
    });

    expect(result).toBeNull();
  });
});

describe("getAmountScreenRawMessage", () => {
  it("returns an input-blocking recipient error even without a raw amount", () => {
    const recipientError = createNamedError("SourceHasMultiSign");
    const status = createStatus({
      errors: { recipient: recipientError },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: false })).toEqual({
      type: "error",
      error: recipientError,
    });
    expect(isAmountInputDisabledByRecipientError(status)).toBe(true);
  });

  it("supports family-specific variants through the generic recipient error suffix", () => {
    const recipientError = createNamedError("CustomSourceHasMultiSign");
    const status = createStatus({
      errors: { recipient: recipientError },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: false })).toEqual({
      type: "error",
      error: recipientError,
    });
    expect(isAmountInputDisabledByRecipientError(status)).toBe(true);
  });

  it("prioritizes blocking errors over warnings when an amount is set", () => {
    const dustLimitError = createNamedError("DustLimit");
    const feeTooHighWarning = createNamedError("FeeTooHigh");
    const status = createStatus({
      errors: { dustLimit: dustLimitError },
      warnings: { feeTooHigh: feeTooHighWarning },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: true })).toEqual({
      type: "error",
      error: dustLimitError,
    });
  });

  it("returns fee-too-high as an info message when no blocking error exists", () => {
    const feeTooHighWarning = createNamedError("FeeTooHigh");
    const status = createStatus({
      warnings: { feeTooHigh: feeTooHighWarning },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: true })).toEqual({
      type: "info",
      error: feeTooHighWarning,
    });
  });

  it("classifies the selected amount warning instead of another warning key", () => {
    const amountWarning = createNamedError("RecommendUndelegation");
    const feeTooHighWarning = createNamedError("FeeTooHigh");
    const status = createStatus({
      warnings: {
        amount: amountWarning,
        feeTooHigh: feeTooHighWarning,
      },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: true })).toEqual({
      type: "warning",
      error: amountWarning,
    });
  });

  it("hides AmountRequired", () => {
    const status = createStatus({
      errors: { amount: createNamedError("AmountRequired") },
    });

    expect(getAmountScreenRawMessage({ status, hasRawAmount: false })).toBeNull();
    expect(isAmountInputDisabledByRecipientError(status)).toBe(false);
  });
});
