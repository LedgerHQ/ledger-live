import { isSwapOperationPending } from ".";

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
});
