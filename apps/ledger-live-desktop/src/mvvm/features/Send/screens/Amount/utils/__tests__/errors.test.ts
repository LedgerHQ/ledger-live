import { getStatusError, pickBlockingError } from "../errors";

describe("getStatusError", () => {
  it("returns undefined when errors is undefined", () => {
    expect(getStatusError(undefined, "amount")).toBeUndefined();
  });

  it("returns error for existing key", () => {
    const error = new Error("Amount too high");
    const errors = { amount: error };

    expect(getStatusError(errors, "amount")).toBe(error);
  });

  it("returns undefined for non-existent key", () => {
    const errors = { amount: new Error("Amount too high") };

    expect(getStatusError(errors, "recipient")).toBeUndefined();
  });

  it("handles empty errors object", () => {
    expect(getStatusError({}, "amount")).toBeUndefined();
  });
});

describe("pickBlockingError", () => {
  it("returns undefined when errors is undefined", () => {
    expect(pickBlockingError(undefined)).toBeUndefined();
  });

  it("returns priority error when present", () => {
    const dustLimitError = new Error("Dust limit");
    const recipientError = new Error("Recipient");
    const errors = {
      dustLimit: dustLimitError,
      recipient: recipientError,
      other: new Error("Other"),
    };

    expect(pickBlockingError(errors)).toBe(dustLimitError);
  });

  it("respects priority order: dustLimit > recipient > fees > transaction", () => {
    const recipientError = new Error("Recipient");
    const feesError = new Error("Fees");
    const transactionError = new Error("Transaction");
    const errors = {
      recipient: recipientError,
      fees: feesError,
      transaction: transactionError,
    };

    expect(pickBlockingError(errors)).toBe(recipientError);
  });

  it("returns first priority error found in order", () => {
    const feesError = new Error("Fees");
    const transactionError = new Error("Transaction");
    const errors = {
      fees: feesError,
      transaction: transactionError,
      other: new Error("Other"),
    };

    expect(pickBlockingError(errors)).toBe(feesError);
  });

  it("returns first non-priority error when no priority errors exist", () => {
    const otherError = new Error("Other error");
    const anotherError = new Error("Another error");
    const errors = {
      other: otherError,
      another: anotherError,
    };

    expect(pickBlockingError(errors)).toBe(otherError);
  });

  it("handles empty errors object", () => {
    expect(pickBlockingError({})).toBeUndefined();
  });

  it("skips falsy values", () => {
    const validError = new Error("Valid");
    // Test runtime behavior: Object.values().find(Boolean) skips null/undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors: any = {
      dustLimit: null,
      recipient: undefined,
      other: validError,
    };

    expect(pickBlockingError(errors)).toBe(validError);
  });
});
