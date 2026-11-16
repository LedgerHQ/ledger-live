import { assertValidConcurrency, isValidConcurrency } from "./assertValidConcurrency";

const INVALID_CONCURRENCIES = [0, -1, 1.5, NaN, "5", null, undefined, Number.MAX_SAFE_INTEGER + 1];

describe("isValidConcurrency", () => {
  it.each([1, 5, Number.MAX_SAFE_INTEGER])("accepts %p", concurrency => {
    expect(isValidConcurrency(concurrency)).toBe(true);
  });

  it.each(INVALID_CONCURRENCIES)("rejects %p", concurrency => {
    expect(isValidConcurrency(concurrency)).toBe(false);
  });
});

describe("assertValidConcurrency", () => {
  it("accepts a valid concurrency", () => {
    expect(() => assertValidConcurrency(5)).not.toThrow();
  });

  it.each([0, -1, 1.5, NaN])("rejects %p", concurrency => {
    expect(() => assertValidConcurrency(concurrency)).toThrow(
      `Invalid concurrency: ${concurrency}`,
    );
  });
});
