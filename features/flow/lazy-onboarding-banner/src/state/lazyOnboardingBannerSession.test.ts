import {
  dismissLazyOnboardingBannerForSession,
  getLazyOnboardingBannerDismissed,
  resetLazyOnboardingBannerSession,
  subscribeToLazyOnboardingBannerSession,
} from "./lazyOnboardingBannerSession";

describe("lazyOnboardingBannerSession", () => {
  beforeEach(() => {
    resetLazyOnboardingBannerSession();
  });

  it("should remain dismissed until the session is reset", () => {
    dismissLazyOnboardingBannerForSession();
    expect(getLazyOnboardingBannerDismissed()).toBe(true);

    resetLazyOnboardingBannerSession();
    expect(getLazyOnboardingBannerDismissed()).toBe(false);
  });

  it("should notify subscribers only when the value changes", () => {
    const listener = jest.fn();
    const unsubscribe = subscribeToLazyOnboardingBannerSession(listener);

    dismissLazyOnboardingBannerForSession();
    dismissLazyOnboardingBannerForSession();
    resetLazyOnboardingBannerSession();
    resetLazyOnboardingBannerSession();

    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
