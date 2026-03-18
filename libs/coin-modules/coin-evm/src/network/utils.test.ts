import { isHttpRateLimitError } from "./utils";

describe("utils", () => {
  describe("isHttpRateLimitError", () => {
    it("should return true when error is a rate limit", () => {
      expect(isHttpRateLimitError({ response: { status: 429 } })).toEqual(true);
    });

    it.each([
      { case: "undefined", error: undefined },
      { case: "empty string", error: "" },
      { case: "number", error: 1 },
      { case: "boolean", error: true },
      { case: "empty object", error: {} },
      { case: "standard error", error: new Error() },
      { case: "other http error", error: { response: { status: 400 } } },
    ])("should return false when error ($case) is not a rate limit", ({ error }) => {
      expect(isHttpRateLimitError(error)).toEqual(false);
    });
  });
});
