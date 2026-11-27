import { tuning } from "./tuning";

describe("tuning", () => {
  it("takes an integer override at or above the minimum", () => {
    expect(tuning(0, 5)).toBe(0);
    expect(tuning(3, 5, 1)).toBe(3);
  });

  it.each([undefined, null, "10", 12.5, Number.NaN, Infinity, -1])(
    "falls back to the default for %p",
    value => {
      expect(tuning(value, 5)).toBe(5);
    },
  );

  it("falls back below the minimum", () => {
    expect(tuning(0, 5, 1)).toBe(5);
  });
});
