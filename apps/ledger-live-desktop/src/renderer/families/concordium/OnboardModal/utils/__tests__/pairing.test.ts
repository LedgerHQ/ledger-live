import { AccountOnboardStatus, ConcordiumPairingStatus } from "@ledgerhq/coin-concordium/types";
import {
  getConfirmationCode,
  shouldRetryPairing,
  handlePairingProgress,
  MAX_EXPIRED_RETRIES,
} from "../pairing";

describe("pairing utils", () => {
  describe("getConfirmationCode", () => {
    it("returns first 4 characters uppercase", () => {
      expect(getConfirmationCode("abcdef")).toBe("ABCD");
    });

    it("returns exactly 4 characters when input is exactly 4", () => {
      expect(getConfirmationCode("abcd")).toBe("ABCD");
    });

    it("throws on short strings", () => {
      expect(() => getConfirmationCode("ab")).toThrow(
        "Invalid sessionTopic: expected at least 4 characters, got 2",
      );
    });

    it("throws on empty string", () => {
      expect(() => getConfirmationCode("")).toThrow(
        "Invalid sessionTopic: expected at least 4 characters, got 0",
      );
    });

    it("uppercases mixed case input", () => {
      expect(getConfirmationCode("AbCdEf")).toBe("ABCD");
    });
  });

  describe("shouldRetryPairing", () => {
    it("returns true for expired error under retry limit", () => {
      const error = new Error("Session expired");

      expect(shouldRetryPairing(error, 0)).toBe(true);
      expect(shouldRetryPairing(error, 1)).toBe(true);
      expect(shouldRetryPairing(error, 2)).toBe(true);
    });

    it("returns false when retry limit reached", () => {
      const error = new Error("Session expired");

      expect(shouldRetryPairing(error, MAX_EXPIRED_RETRIES)).toBe(false);
    });

    it("returns false for non-expired errors", () => {
      const error = new Error("Connection failed");

      expect(shouldRetryPairing(error, 0)).toBe(false);
    });

    it("handles string errors", () => {
      expect(shouldRetryPairing("expired", 0)).toBe(true);
      expect(shouldRetryPairing("other error", 0)).toBe(false);
    });

    it("handles null/undefined errors", () => {
      expect(shouldRetryPairing(null, 0)).toBe(false);
      expect(shouldRetryPairing(undefined, 0)).toBe(false);
    });
  });

  describe("handlePairingProgress", () => {
    it("returns state update for PREPARE status with walletConnectUri", () => {
      const data = {
        status: ConcordiumPairingStatus.PREPARE,
        walletConnectUri: "wc:test-uri",
      };

      const result = handlePairingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.PREPARE,
        walletConnectUri: "wc:test-uri",
      });
    });

    it("returns null for PREPARE status without walletConnectUri", () => {
      const data = {
        status: ConcordiumPairingStatus.PREPARE,
      };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const result = handlePairingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns state update for SUCCESS status with sessionTopic", () => {
      const data = {
        status: ConcordiumPairingStatus.SUCCESS,
        sessionTopic: "test-session-topic",
      };

      const result = handlePairingProgress(data);

      expect(result).toEqual({
        isPairing: false,
        onboardingStatus: AccountOnboardStatus.SUCCESS,
        sessionTopic: "test-session-topic",
        walletConnectUri: null,
      });
    });

    it("returns null for SUCCESS status without sessionTopic", () => {
      const data = {
        status: ConcordiumPairingStatus.SUCCESS,
      };

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const result = handlePairingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns null for unknown status", () => {
      const data = {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        status: "UNKNOWN" as ConcordiumPairingStatus,
      };

      const result = handlePairingProgress(data);

      expect(result).toBeNull();
    });
  });
});
