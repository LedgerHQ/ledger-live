import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { openURL } from "~/renderer/linking";
import { track, updateIdentify } from "~/renderer/analytics/segment";
import { EntryPoint } from "../../types/AnalyticsOptInPromptNavigator";
import { ANALYTICS_OPT_IN_VARIANT } from "../../types/variants";
import { useAnalyticsOptInPrompt } from "../useCommonLogic";

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

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

describe("useAnalyticsOptInPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("isFeatureFlagsAnalyticsPrefDisplayed", () => {
    it("should enable the prompt on onboarding when the user has not seen it", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
          },
        },
      );

      expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(true);
    });

    it("should enable the prompt on onboarding even when the user has already seen it", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: true }),
          },
        },
      );

      expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(true);
    });

    it("should enable the prompt on portfolio when the user has not seen it", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.portfolio }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
          },
        },
      );

      expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(true);
    });

    it("should disable the prompt on portfolio when the user has already seen it", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.portfolio }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: true }),
          },
        },
      );

      expect(result.current.isFeatureFlagsAnalyticsPrefDisplayed).toBe(false);
    });
  });

  describe("openAnalyticsOptInPrompt", () => {
    it("should open the drawer when called", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings(),
          },
        },
      );

      act(() => {
        result.current.openAnalyticsOptInPrompt("/onboarding", jest.fn());
      });

      expect(result.current.analyticsOptInPromptProps.isOpened).toBe(true);
    });
  });

  describe("onSubmit", () => {
    it("should persist consent, mark the prompt as seen, and run the onboarding callback", async () => {
      const nextStep = jest.fn();
      const { result, store } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
          },
        },
      );

      act(() => {
        result.current.openAnalyticsOptInPrompt("/onboarding", nextStep);
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      const settings = store.getState().settings;
      expect(settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(settings.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
      expect(settings.analyticsConsentInfo.consentDate).not.toBeNull();
      expect(updateIdentify).toHaveBeenCalledWith({ force: true });
      expect(nextStep).toHaveBeenCalledTimes(1);
      expect(result.current.analyticsOptInPromptProps.isOpened).toBe(false);
    });

    it("should not run the portfolio callback after submit", async () => {
      const nextStep = jest.fn();
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.portfolio }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
          },
        },
      );

      act(() => {
        result.current.openAnalyticsOptInPrompt("/portfolio", nextStep);
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(nextStep).not.toHaveBeenCalled();
    });
  });

  describe("handleOpenPrivacyPolicy", () => {
    it("should open the tracking policy URL and track the click", () => {
      const { result } = renderHook(
        () => useAnalyticsOptInPrompt({ entryPoint: EntryPoint.onboarding }),
        {
          initialState: {
            ...featureFlagsWithAnalyticsOptIn,
            settings: baseSettings({ hasSeenAnalyticsOptInPrompt: false }),
          },
        },
      );

      act(() => {
        result.current.handleOpenPrivacyPolicy("Analytics Opt In Prompt Main");
      });

      expect(openURL).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "Learn more link",
          flow: "consent onboarding",
          variant: ANALYTICS_OPT_IN_VARIANT,
          page: "Analytics Opt In Prompt Main",
        },
        true,
      );
    });
  });
});
