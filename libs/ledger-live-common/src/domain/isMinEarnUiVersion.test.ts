import { isMinEarnUiVersion } from "./isMinEarnUiVersion";

describe("isMinEarnUiVersion", () => {
  it.each([
    ["v2", "v2", true],
    ["v2", "v1", true],
    ["v2", "v3", false],
    ["v3", "v2", true],
    ["v3", "v3", true],
  ])("normalised inputs: (%s, %s) => %s", (actual, minimum, expected) => {
    expect(isMinEarnUiVersion(actual, minimum)).toBe(expected);
  });

  it.each([
    ["2", "v2", true],
    ["v2", "2", true],
    ["3", "v2", true],
    ["1", "2", false],
  ])("bare digit coercion: (%s, %s) => %s", (actual, minimum, expected) => {
    expect(isMinEarnUiVersion(actual, minimum)).toBe(expected);
  });

  it.each([
    [null, "v1", true],
    [null, "v2", false],
    [undefined, "v1", true],
    [undefined, "v2", false],
  ])("nullish actual falls back to v1: (%s, %s) => %s", (actual, minimum, expected) => {
    expect(isMinEarnUiVersion(actual, minimum)).toBe(expected);
  });

  it("invalid actual coerces to v1", () => {
    expect(isMinEarnUiVersion("garbage", "v1")).toBe(true);
    expect(isMinEarnUiVersion("garbage", "v2")).toBe(false);
  });

  it("invalid minimum returns false", () => {
    expect(isMinEarnUiVersion("v2", "garbage")).toBe(false);
  });

  it.each([
    ["v10", "v9", true],
    ["v9", "v10", false],
  ])("numeric comparison, not lexicographic: (%s, %s) => %s", (actual, minimum, expected) => {
    expect(isMinEarnUiVersion(actual, minimum)).toBe(expected);
  });

  it.each([
    [2, "v2", true],
    [2, "v3", false],
    [3, 2, true],
    [1, 2, false],
  ])("number coercion: (%s, %s) => %s", (actual, minimum, expected) => {
    expect(isMinEarnUiVersion(actual, minimum)).toBe(expected);
  });
});
