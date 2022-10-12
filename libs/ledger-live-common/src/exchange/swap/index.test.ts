import { isSwapOperationPending, getSwapAPIVersion } from ".";

import { getEnv, setEnv } from "../../env";

describe("swap/index", () => {
  describe("isSwapOperationPending", () => {
    test("should return false for ok status", () => {
      const result = isSwapOperationPending("finished");

      expect(result).toBe(false);
    });

    test("should return false for ko status", () => {
      const result = isSwapOperationPending("refunded");

      expect(result).toBe(false);
    });

    test("should return true for other status", () => {
      const result = isSwapOperationPending("RANDOM_STATUS");

      expect(result).toBe(true);
    });

    test("should return true if not status provided", () => {
      /**
       * Since this TS function can be used in loosly typed JS code, we need
       * to test the case of the parameter not being provided
       */

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const result = isSwapOperationPending();

      expect(result).toBe(true);
    });
  });

  describe("getSwapAPIVersion", () => {
    const DEFAULT_SWAP_API_BASE = getEnv("SWAP_API_BASE");

    afterEach(() => {
      // Restore DEFAULT_SWAP_API_BASE
      setEnv("SWAP_API_BASE", DEFAULT_SWAP_API_BASE);
    });

    test("should return version when SWAP_API_BASE contains one", () => {
      const result = getSwapAPIVersion();

      expect(result).toBe(4);
    });

    test("should throw an error if no version in SWAP_API_BASE", () => {
      setEnv("SWAP_API_BASE", "https://swap.ledger.com");

      expect(getSwapAPIVersion).toThrow(Error);
      expect(getSwapAPIVersion).toThrow(
        "Configured swap API base URL is invalid, should end with /v<number>"
      );
    });

    test("should throw an error if version is NaN", () => {
      setEnv("SWAP_API_BASE", "https://swap.ledger.com/vtest");

      expect(getSwapAPIVersion).toThrow(Error);
      expect(getSwapAPIVersion).toThrow(
        "Configured swap API base URL is invalid, should end with /v<number>"
      );
    });
  });
});
