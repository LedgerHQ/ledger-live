import { isAccountDetailAnalyticsBannerEnabled } from "./isAccountDetailAnalyticsBannerEnabled";

describe("isAccountDetailAnalyticsBannerEnabled", () => {
  it.each([
    ["is disabled when the flag is missing", null, false],
    ["is disabled when the param is missing", { enabled: true }, false],
    [
      "is disabled when the param is off",
      { enabled: true, params: { analyticsBanner: false } },
      false,
    ],
    [
      "is disabled when the flag is off",
      { enabled: false, params: { analyticsBanner: true } },
      false,
    ],
    [
      "is enabled when the flag and the param are on",
      { enabled: true, params: { analyticsBanner: true } },
      true,
    ],
  ])("%s", (_case, feature, expected) => {
    expect(isAccountDetailAnalyticsBannerEnabled(feature)).toBe(expected);
  });
});
