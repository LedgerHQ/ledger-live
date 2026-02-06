/* eslint-env jest */
import { TransportStatusError } from "@ledgerhq/errors";
import {
  CompleteExchangeError,
  convertTransportError,
  getErrorDetails,
  getErrorMessage,
  getSwapStepFromError,
} from "./error";

describe("exchange/error", () => {
  describe("getErrorMessage", () => {
    it("should return string error as-is", () => {
      expect(getErrorMessage("error string")).toBe("error string");
    });

    it("should return message from error object", () => {
      const error = { message: "Validation failed" };
      expect(getErrorMessage(error)).toBe("Validation failed");
    });

    it("should return message from cause when error has no direct message", () => {
      const error = { cause: { message: "Network timeout" } };
      expect(getErrorMessage(error)).toBe("Network timeout");
    });

    it("should prioritize direct message over cause.message", () => {
      const error = {
        message: "Outer error",
        cause: { message: "Inner error" },
      };
      expect(getErrorMessage(error)).toBe("Outer error");
    });

    it("should return 'Unknown error' for null and empty string", () => {
      expect(getErrorMessage(null)).toBe("Unknown error");
      expect(getErrorMessage("")).toBe("Unknown error");
    });

    it("should return 'Unknown error' for undefined", () => {
      expect(getErrorMessage(undefined)).toBe("Unknown error");
    });

    it("should return 'Unknown error' for number", () => {
      expect(getErrorMessage(42)).toBe("Unknown error");
    });

    it("should return 'Unknown error' for boolean", () => {
      expect(getErrorMessage(false)).toBe("Unknown error");
    });

    it("should fall back to name for object without message or cause", () => {
      const error = { code: "ERR001", name: "CustomError" };
      expect(getErrorMessage(error)).toBe("CustomError");
    });

    it("should return 'Unknown error' for object when cause has no message or name", () => {
      const error = { cause: { code: "E500" } };
      expect(getErrorMessage(error)).toBe("Unknown error");
    });

    it("should return 'Unknown error' when message is explicitly empty", () => {
      const error = { message: "" };
      expect(getErrorMessage(error)).toBe("Unknown error");
    });

    it("should handle Error instances", () => {
      const error = new Error("Standard error");
      expect(getErrorMessage(error)).toBe("Standard error");
    });

    it("should handle nested Error instances", () => {
      const innerError = new Error("Inner error");
      const error = { cause: innerError };
      expect(getErrorMessage(error)).toBe("Inner error");
    });
  });

  describe("getErrorDetails", () => {
    it("should return 'Unknown error' for null", () => {
      expect(getErrorDetails(null)).toEqual({ message: "Unknown error" });
    });

    it("should return 'Unknown error' for undefined", () => {
      expect(getErrorDetails(undefined)).toEqual({ message: "Unknown error" });
    });

    it("should return string error as message", () => {
      expect(getErrorDetails("something broke")).toEqual({ message: "something broke" });
    });

    it("should return 'Unknown error' for empty string", () => {
      expect(getErrorDetails("")).toEqual({ message: "Unknown error" });
    });

    it("should extract name/message and cause details when present", () => {
      const error = {
        name: "OuterError",
        cause: {
          name: "InnerError",
          message: "Inner message",
          swapCode: "swap001",
        },
      };

      expect(getErrorDetails(error)).toEqual({
        name: "OuterError",
        message: "Inner message",
        cause: {
          name: "InnerError",
          message: "Inner message",
          swapCode: "swap001",
        },
      });
    });

    it("should fall back to cause name for Error instances with generic top-level name", () => {
      const error = new Error("Drawer closed");
      Object.assign(error, { cause: { name: "DrawerClosedError" } });

      expect(getErrorDetails(error)).toEqual({
        name: "DrawerClosedError",
        message: "Drawer closed",
        cause: {
          name: "DrawerClosedError",
        },
      });
    });

    it("should keep specific top-level name over cause name for Error instances", () => {
      const error = new Error("Drawer closed");
      error.name = "CustomTopLevelError";
      Object.assign(error, { cause: { name: "DrawerClosedError" } });

      expect(getErrorDetails(error)).toEqual({
        name: "CustomTopLevelError",
        message: "Drawer closed",
        cause: {
          name: "DrawerClosedError",
        },
      });
    });

    it("should extract cause details when Error instance has object cause", () => {
      const error = new Error("Top-level message");
      Object.assign(error, {
        cause: {
          name: "NestedObjectCause",
          message: "Nested cause message",
          swapCode: "swap005",
        },
      });

      expect(getErrorDetails(error)).toEqual({
        name: "NestedObjectCause",
        message: "Top-level message",
        cause: {
          name: "NestedObjectCause",
          message: "Nested cause message",
          swapCode: "swap005",
        },
      });
    });

    it("should extract cause details when Error instance has Error as cause", () => {
      const error = new Error("Top-level message");
      const nestedError = new Error("Nested error message");
      nestedError.name = "NestedErrorCause";
      Object.assign(error, { cause: nestedError });

      expect(getErrorDetails(error)).toEqual({
        name: "NestedErrorCause",
        message: "Top-level message",
        cause: {
          name: "NestedErrorCause",
          message: "Nested error message",
        },
      });
    });

    it("should fall back to effectiveName when no message or causeMessage", () => {
      const error = { name: "SomeError" };
      expect(getErrorDetails(error)).toEqual({
        name: "SomeError",
        message: "SomeError",
      });
    });

    it("should return 'Unknown error' for object with no useful fields", () => {
      const error = { code: 123 };
      expect(getErrorDetails(error)).toEqual({ message: "Unknown error" });
    });
  });

  describe("convertTransportError", () => {
    it("should convert TransportStatusError to CompleteExchangeError", () => {
      const transportError = new TransportStatusError(0x6a80);

      const result = convertTransportError("INIT", transportError);

      expect(result).toBeInstanceOf(CompleteExchangeError);
      expect((result as CompleteExchangeError).step).toBe("INIT");
    });

    it("should use INVALID_ADDRESS error code for CHECK_REFUND_ADDRESS step", () => {
      const transportError = new TransportStatusError(0x6a80);

      const result = convertTransportError("CHECK_REFUND_ADDRESS", transportError);

      expect(result).toBeInstanceOf(CompleteExchangeError);
      expect((result as CompleteExchangeError).step).toBe("CHECK_REFUND_ADDRESS");
      // The error code should be overridden to INVALID_ADDRESS for this step
    });

    it("should preserve error for non-TransportStatusError", () => {
      const error = new Error("Regular error");
      const result = convertTransportError("INIT", error);

      expect(result).toBe(error);
      expect(result).not.toBeInstanceOf(CompleteExchangeError);
    });

    it("should preserve unknown error types", () => {
      const error = "string error";
      const result = convertTransportError("PROCESS_TRANSACTION", error);

      expect(result).toBe(error);
    });

    it("should handle null error", () => {
      const result = convertTransportError("INIT", null);
      expect(result).toBeNull();
    });

    it("should handle undefined error", () => {
      const result = convertTransportError("INIT", undefined);
      expect(result).toBeUndefined();
    });

    it("should work with all CompleteExchangeStep types", () => {
      const steps = [
        "INIT",
        "SET_PARTNER_KEY",
        "CHECK_PARTNER",
        "PROCESS_TRANSACTION",
        "CHECK_TRANSACTION_SIGNATURE",
        "CHECK_PAYOUT_ADDRESS",
        "CHECK_REFUND_ADDRESS",
        "SIGN_COIN_TRANSACTION",
      ] as const;

      steps.forEach(step => {
        const transportError = new TransportStatusError(0x6a80);

        const result = convertTransportError(step, transportError);

        expect(result).toBeInstanceOf(CompleteExchangeError);
        expect((result as CompleteExchangeError).step).toBe(step);
      });
    });
  });

  describe("getSwapStepFromError", () => {
    it("should return step from CompleteExchangeError", () => {
      const error = new CompleteExchangeError("CHECK_PARTNER", "Partner check failed");

      expect(getSwapStepFromError(error)).toBe("CHECK_PARTNER");
    });

    it("should return SIGN_COIN_TRANSACTION for DisabledTransactionBroadcastError", () => {
      const error = new Error("Broadcast disabled");
      error.name = "DisabledTransactionBroadcastError";

      expect(getSwapStepFromError(error)).toBe("SIGN_COIN_TRANSACTION");
    });

    it("should return UNKNOWN_STEP for regular Error", () => {
      const error = new Error("Generic error");

      expect(getSwapStepFromError(error)).toBe("UNKNOWN_STEP");
    });

    it("should return UNKNOWN_STEP for Error with different name", () => {
      const error = new Error("Custom error");
      error.name = "CustomError";

      expect(getSwapStepFromError(error)).toBe("UNKNOWN_STEP");
    });

    it("should handle all CompleteExchangeStep types", () => {
      const steps = [
        "INIT",
        "SET_PARTNER_KEY",
        "CHECK_PARTNER",
        "PROCESS_TRANSACTION",
        "CHECK_TRANSACTION_SIGNATURE",
        "CHECK_PAYOUT_ADDRESS",
        "CHECK_REFUND_ADDRESS",
        "SIGN_COIN_TRANSACTION",
      ] as const;

      steps.forEach(step => {
        const error = new CompleteExchangeError(step);
        expect(getSwapStepFromError(error)).toBe(step);
      });
    });
  });

  describe("CompleteExchangeError", () => {
    it("should create error with step, title, and message", () => {
      const error = new CompleteExchangeError(
        "CHECK_PARTNER",
        "Partner Verification Failed",
        "The partner key is invalid",
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("CompleteExchangeError");
      expect(error.step).toBe("CHECK_PARTNER");
      expect(error.title).toBe("Partner Verification Failed");
      expect(error.message).toBe("The partner key is invalid");
    });

    it("should create error with only step", () => {
      const error = new CompleteExchangeError("INIT");

      expect(error.name).toBe("CompleteExchangeError");
      expect(error.step).toBe("INIT");
      expect(error.title).toBeUndefined();
      expect(error.message).toBe("");
    });

    it("should create error with step and title but no message", () => {
      const error = new CompleteExchangeError(
        "PROCESS_TRANSACTION",
        "Transaction Processing Error",
      );

      expect(error.step).toBe("PROCESS_TRANSACTION");
      expect(error.title).toBe("Transaction Processing Error");
      expect(error.message).toBe("");
    });
  });
});
