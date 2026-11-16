import { assertValidPaginationLimit, isValidPaginationLimit } from "./assertValidPaginationLimit";

const INVALID_LIMITS = [0, -1, 1.5, NaN, "10", null, undefined, Number.MAX_SAFE_INTEGER + 1];

describe("isValidPaginationLimit", () => {
  it.each([1, 100, Number.MAX_SAFE_INTEGER])("accepts %p", limit => {
    expect(isValidPaginationLimit(limit)).toBe(true);
  });

  it.each(INVALID_LIMITS)("rejects %p", limit => {
    expect(isValidPaginationLimit(limit)).toBe(false);
  });
});

describe("assertValidPaginationLimit", () => {
  it("accepts a valid limit", () => {
    expect(() => assertValidPaginationLimit(100)).not.toThrow();
  });

  it.each([0, -1, 1.5, NaN])("rejects %p", limit => {
    expect(() => assertValidPaginationLimit(limit)).toThrow(`Invalid pagination limit: ${limit}`);
  });
});
