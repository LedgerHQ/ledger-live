import { hasEthersRetriedOnRateLimit, isRateLimitRpcMethodError } from "./rpc.errors";

describe("rpc.errors", () => {
  describe("isRateLimitRpcMethodError", () => {
    it.each([-32012, -32029])(
      "should return true for rate limit error code on rate limit",
      (code: number) => {
        expect(isRateLimitRpcMethodError({ code })).toBe(true);
      },
    );

    it.each([-1, 0])("should return false for non rate limit error code", (code: number) => {
      expect(isRateLimitRpcMethodError({ code })).toBe(false);
    });
  });

  describe("hasEthersRetriedOnRateLimit", () => {
    it("should return true when response status is 'exceeded maximum retry limit'", () => {
      expect(hasEthersRetriedOnRateLimit({ responseStatus: "exceeded maximum retry limit" })).toBe(
        true,
      );
    });

    it.each([undefined, {}, -1, 0, "", "non empty string", { key: {} }])(
      "should return false when error has no response status (%s)",
      (error: unknown) => {
        expect(hasEthersRetriedOnRateLimit(error)).toBe(false);
      },
    );

    it("should return false when response status does not contains 'exceeded maximum retry limit'", () => {
      expect(hasEthersRetriedOnRateLimit({ responseStatus: "another error" })).toBe(false);
    });
  });
});
