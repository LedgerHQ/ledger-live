import { shouldShowAccountAnalyticsIntroduction } from "./shouldShowAccountAnalyticsIntroduction";

describe("shouldShowAccountAnalyticsIntroduction", () => {
  it.each([
    [false, false, false],
    [false, true, false],
    [true, false, true],
    [true, true, false],
  ])(
    "should resolve confirmed history %s and dismissal %s to visibility %s",
    (hasConfirmedHistory, hasDismissed, expected) => {
      expect(shouldShowAccountAnalyticsIntroduction({ hasConfirmedHistory, hasDismissed })).toBe(
        expected,
      );
    },
  );
});
