import { shouldShowAccountAnalyticsIntroduction } from "./shouldShowAccountAnalyticsIntroduction";

const visibleStatus = {
  isEnabled: true,
  isEligible: true,
  hasConfirmedHistory: true,
  hasDismissed: false,
};

describe("shouldShowAccountAnalyticsIntroduction", () => {
  it("should show the introduction when every condition is met", () => {
    expect(shouldShowAccountAnalyticsIntroduction(visibleStatus)).toBe(true);
  });

  it.each([
    { isEnabled: false },
    { isEligible: false },
    { hasConfirmedHistory: false },
    { hasDismissed: true },
  ])("should hide the introduction with %o", override => {
    expect(shouldShowAccountAnalyticsIntroduction({ ...visibleStatus, ...override })).toBe(false);
  });
});
