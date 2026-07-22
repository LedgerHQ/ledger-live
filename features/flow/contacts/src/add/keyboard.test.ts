import { shouldAddAddContactKeyboardInset } from "./keyboard";

describe("shouldAddAddContactKeyboardInset", () => {
  it.each([
    [true, "ios", 18],
    [true, "android", 35],
    [false, "android", 34],
  ] as const)("should return %s for %s version %s", (shouldAddInset, platform, version) => {
    expect(shouldAddAddContactKeyboardInset(platform, version)).toBe(shouldAddInset);
  });
});
