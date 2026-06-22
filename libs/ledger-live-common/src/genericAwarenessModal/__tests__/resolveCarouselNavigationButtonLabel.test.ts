import { resolveCarouselNavigationButtonLabel } from "../resolveCarouselNavigationButtonLabel";

describe("resolveCarouselNavigationButtonLabel", () => {
  it.each([
    ["", "Continue", "Continue"],
    ["   ", "Close", "Close"],
    ["Next step", "Continue", "Next step"],
    ["  Done  ", "Close", "Done"],
  ] as const)(
    "should return %j when navigationButtonLabel is %j and default is %j",
    (navigationButtonLabel, defaultLabel, expectedLabel) => {
      expect(resolveCarouselNavigationButtonLabel(navigationButtonLabel, defaultLabel)).toBe(
        expectedLabel,
      );
    },
  );
});
