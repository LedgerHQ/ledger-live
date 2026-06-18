import { renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useDisplayOnPortfolioAnalytics } from "../useDisplayOnPortfolio";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  updateIdentify: jest.fn().mockResolvedValue(undefined),
}));

const featureFlagsWithAnalyticsOptIn = withFlagOverrides({
  analyticsOptIn: { enabled: true },
});

function baseSettings(overrides: Record<string, unknown> = {}) {
  return {
    ...INITIAL_STATE,
    ...overrides,
  };
}

describe("useDisplayOnPortfolioAnalytics", () => {
  it("should auto-open the drawer when the user has not seen the prompt", () => {
    const { result } = renderHook(() => useDisplayOnPortfolioAnalytics(), {
      initialState: {
        ...featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
      },
    });

    expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(true);
    expect(result.current.analyticsOptInPromptProps.isOpened).toBe(true);
    expect(result.current.analyticsOptInPromptProps.onSubmit).toBeDefined();
  });

  it("should not auto-open the drawer when the user has already seen the prompt", () => {
    const { result } = renderHook(() => useDisplayOnPortfolioAnalytics(), {
      initialState: {
        ...featureFlagsWithAnalyticsOptIn,
        settings: baseSettings({ hasSeenAnalyticsOptInPrompt: true }),
      },
    });

    expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(false);
    expect(result.current.analyticsOptInPromptProps.isOpened).toBe(false);
  });
});
