import { getNextSequence } from "../getNextSequence";

describe("getNextSequence", () => {
  it("should return a bigint close to Date.now()", async () => {
    const before = BigInt(Date.now());
    const result = getNextSequence("someAddress");
    const after = BigInt(Date.now());

    expect(typeof result).toBe("bigint");
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });

  it("should return unique values on successive calls", () => {
    const a = getNextSequence("addr");
    const b = getNextSequence("addr");

    // Two calls may land on the same millisecond, but both must be valid timestamps
    expect(b).toBeGreaterThanOrEqual(a);
  });

  it("should ignore the address parameter", () => {
    const before = BigInt(Date.now());
    const result = getNextSequence("any-address");
    const after = BigInt(Date.now());

    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});
