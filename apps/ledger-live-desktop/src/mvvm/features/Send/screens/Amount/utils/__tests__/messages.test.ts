import { getAmountScreenMessage } from "../messages";

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
