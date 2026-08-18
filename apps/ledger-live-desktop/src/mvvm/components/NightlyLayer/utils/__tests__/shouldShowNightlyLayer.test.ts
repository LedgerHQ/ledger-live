import { shouldShowNightlyLayer } from "../shouldShowNightlyLayer";

describe("shouldShowNightlyLayer", () => {
  it.each([
    [false, "nightly", false],
    [true, "null", false],
    [true, "next", false],
    [true, "nightly-sha", false],
    [true, "nightly", true],
    ["null", "nightly", false],
    [true, null, false],
  ])("returns visibility for prerelease=%p channel=%p", (isPrerelease, channel, expected) => {
    expect(shouldShowNightlyLayer(isPrerelease, channel)).toBe(expected);
  });
});
