import { applyRatio } from "../applyRatio";

describe("applyRatio", () => {
  it("takes the ratio of the value, rounded down", () => {
    expect(applyRatio(10.005, 0.5, 2)).toBe(5);
  });

  it("subtracts the buffer from MAX only", () => {
    expect(applyRatio(100, 1, 2, 0.25)).toBe(99.75);
    expect(applyRatio(100, 0.5, 2, 0.25)).toBe(50);
  });

  it("never goes below zero when the buffer exceeds the value", () => {
    expect(applyRatio(0.1, 1, 2, 0.25)).toBe(0);
  });
});
