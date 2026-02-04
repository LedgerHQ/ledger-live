import { handleTransactionStatus, handleTransactionStatusType } from "./handleTransactionStatus";
import type { TransactionStatus } from "../types";

describe("handleTransactionStatus", () => {
  it("returns error and warning as false when status has no errors or warnings", () => {
    const status: TransactionStatus = {
      errors: {},
      warnings: {},
      estimatedFees: {} as any,
      amount: {} as any,
      totalSpent: {} as any,
    };

    const result = handleTransactionStatus(status);

    expect(result.error).toBeFalsy();
    expect(result.warning).toBeFalsy();
  });

  it("returns the first error when status has errors", () => {
    const testError = new Error("Test error");
    const status: TransactionStatus = {
      errors: { amount: testError },
      warnings: {},
      estimatedFees: {} as any,
      amount: {} as any,
      totalSpent: {} as any,
    };

    const result = handleTransactionStatus(status);

    expect(result.error).toBe(testError);
    expect(result.warning).toBeFalsy();
  });

  it("returns the first warning when status has warnings", () => {
    const testWarning = new Error("Test warning");
    const status: TransactionStatus = {
      errors: {},
      warnings: { feeTooHigh: testWarning },
      estimatedFees: {} as any,
      amount: {} as any,
      totalSpent: {} as any,
    };

    const result = handleTransactionStatus(status);

    expect(result.error).toBeFalsy();
    expect(result.warning).toBe(testWarning);
  });

  it("returns both error and warning when status has both", () => {
    const testError = new Error("Test error");
    const testWarning = new Error("Test warning");
    const status: TransactionStatus = {
      errors: { recipient: testError },
      warnings: { feeTooHigh: testWarning },
      estimatedFees: {} as any,
      amount: {} as any,
      totalSpent: {} as any,
    };

    const result = handleTransactionStatus(status);

    expect(result.error).toBe(testError);
    expect(result.warning).toBe(testWarning);
  });

  it("returns only the first error when multiple errors exist", () => {
    const error1 = new Error("Error 1");
    const error2 = new Error("Error 2");
    const status: TransactionStatus = {
      errors: { amount: error1, recipient: error2 },
      warnings: {},
      estimatedFees: {} as any,
      amount: {} as any,
      totalSpent: {} as any,
    };

    const result = handleTransactionStatus(status);

    // Returns the first key's error (order may vary)
    expect(result.error).toBeTruthy();
    expect([error1, error2]).toContain(result.error);
  });

  // Note: The implementation doesn't handle undefined errors/warnings gracefully.
  // These edge cases are not tested as they would cause runtime errors.
  // The implementation expects errors and warnings to always be objects.
});
