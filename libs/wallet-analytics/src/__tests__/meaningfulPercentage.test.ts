import { meaningfulPercentage } from "../meaningfulPercentage";

describe("meaningfulPercentage", () => {
  it("returns the percentage when inputs are valid", () => {
    expect(meaningfulPercentage(10, 100)).toBe(0.1);
  });

  it("returns undefined (not null, not 0) when deltaChange is falsy", () => {
    expect(meaningfulPercentage(0, 100)).toBeUndefined();
    expect(meaningfulPercentage(null, 100)).toBeUndefined();
    expect(meaningfulPercentage(undefined, 100)).toBeUndefined();
  });

  it("returns undefined when balanceDivider is falsy or zero", () => {
    expect(meaningfulPercentage(10, 0)).toBeUndefined();
    expect(meaningfulPercentage(10, null)).toBeUndefined();
    expect(meaningfulPercentage(10, undefined)).toBeUndefined();
  });

  it("returns undefined when the percentage exceeds the threshold", () => {
    expect(meaningfulPercentage(100001, 1)).toBeUndefined();
  });

  it("returns the percentage when it exactly equals the threshold minus epsilon", () => {
    expect(meaningfulPercentage(99999, 1)).toBe(99999);
  });

  it("respects a custom percentageHighThreshold", () => {
    expect(meaningfulPercentage(200, 1, 100)).toBeUndefined();
    expect(meaningfulPercentage(50, 1, 100)).toBe(50);
  });
});
