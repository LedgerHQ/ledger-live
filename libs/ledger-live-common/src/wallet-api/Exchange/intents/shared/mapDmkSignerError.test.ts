import { LockedDeviceError, UserRefusedOnDevice } from "@ledgerhq/errors";
import { EthAppPleaseEnableContractData } from "@ledgerhq/live-signer-evm/errors";
import { mapDmkSignerError } from "./mapDmkSignerError";

describe("mapDmkSignerError", () => {
  describe("typed-error mapping (mirrors DmkSignerEth._mapError)", () => {
    it("returns LockedDeviceError for SW 5515, carrying the DMK-sourced message", () => {
      const result = mapDmkSignerError(
        { _tag: "EthAppCommandError", errorCode: "5515", message: "Locked" },
        "Sign approval failed",
      );
      expect(result).toBeInstanceOf(LockedDeviceError);
      expect(result.message).toBe("EthAppCommandError (code: 5515) - Locked");
    });

    it("returns UserRefusedOnDevice for SW 6985, carrying the DMK-sourced message", () => {
      const result = mapDmkSignerError(
        {
          _tag: "EthAppCommandError",
          errorCode: "6985",
          message: "Condition not satisfied",
        },
        "Sign approval failed",
      );
      expect(result).toBeInstanceOf(UserRefusedOnDevice);
      expect(result.message).toBe(
        "EthAppCommandError (code: 6985) - Condition not satisfied",
      );
    });

    it("returns EthAppPleaseEnableContractData for SW 6a80, carrying the DMK-sourced message", () => {
      const result = mapDmkSignerError(
        { _tag: "EthAppCommandError", errorCode: "6a80", message: "Invalid data" },
        "Sign approval failed",
      );
      expect(result).toBeInstanceOf(EthAppPleaseEnableContractData);
      expect(result.message).toBe(
        "EthAppCommandError (code: 6a80) - Invalid data",
      );
    });
  });

  describe("default branch (preserves structured info)", () => {
    it("embeds _tag, errorCode, and message in the surfaced string", () => {
      const result = mapDmkSignerError(
        {
          _tag: "EthAppCommandError",
          errorCode: "6800",
          message: "Internal error (Please report)",
        },
        "Sign swap failed",
      );
      expect(result.message).toBe(
        "EthAppCommandError (code: 6800) - Internal error (Please report)",
      );
    });

    it("forwards originalError as cause when present", () => {
      const original = new Error("transport closed");
      const result = mapDmkSignerError(
        {
          _tag: "EthAppCommandError",
          errorCode: "6f00",
          message: "Technical problem",
          originalError: original,
        },
        "Sign typed data failed",
      );
      expect(result.cause).toBe(original);
    });

    it("falls back to the per-intent label when DMK ships no _tag", () => {
      const result = mapDmkSignerError(
        { errorCode: "6800", message: "Internal error" },
        "Sign approval failed",
      );
      expect(result.message).toBe(
        "Sign approval failed (code: 6800) - Internal error",
      );
    });

    it("uses just _tag when no errorCode or message is present (UnknownDeviceExchangeError shape)", () => {
      const result = mapDmkSignerError(
        { _tag: "UnknownDeviceExchangeError" },
        "Sign approval failed",
      );
      expect(result.message).toBe("UnknownDeviceExchangeError");
    });

    it("uses the fallback label when the error is empty", () => {
      const result = mapDmkSignerError({}, "Sign approval failed");
      expect(result.message).toBe("Sign approval failed");
    });
  });

  describe("non-object inputs", () => {
    it("wraps a string error with the fallback message", () => {
      const result = mapDmkSignerError("boom", "Sign approval failed");
      expect(result.message).toBe("Sign approval failed");
      expect(result.cause).toBe("boom");
    });

    it("wraps null with the fallback message", () => {
      const result = mapDmkSignerError(null, "Sign approval failed");
      expect(result.message).toBe("Sign approval failed");
      expect(result.cause).toBeNull();
    });

    it("wraps undefined with the fallback message", () => {
      const result = mapDmkSignerError(undefined, "Sign approval failed");
      expect(result.message).toBe("Sign approval failed");
      expect(result.cause).toBeUndefined();
    });
  });
});
