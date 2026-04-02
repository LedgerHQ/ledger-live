import { getNextSequence } from "../getNextSequence";

describe("getNextSequence (MSW)", () => {
  it("should return a positive timestamp-based bigint without any RPC call", () => {
    const before = BigInt(Date.now());
    const result = getNextSequence("someAddress");
    const after = BigInt(Date.now());

    expect(result).toBeGreaterThan(0n);
    expect(result).toBeGreaterThanOrEqual(before);
    expect(result).toBeLessThanOrEqual(after);
  });
});
