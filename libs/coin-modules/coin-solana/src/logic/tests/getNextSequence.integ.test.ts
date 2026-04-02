import { getNextSequence } from "../getNextSequence";

describe("getNextSequence (real RPC)", () => {
  it("should return a positive timestamp-based bigint without hitting the RPC", () => {
    const result = getNextSequence("7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE");

    expect(result).toBeGreaterThan(0n);
  });
});
