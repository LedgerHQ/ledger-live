import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { EntryPoint, FieldKeySwitch } from "../../types/AnalyticsOptInPromptNavigator";
import { ANALYTICS_OPT_IN_VARIANT } from "../../types/variants";
import { ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES } from "../../const/steps";
import { useAnalyticsOptInPromptSteps } from "../useAnalyticsOptInPromptSteps";

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
    hasSeenAnalyticsOptInPrompt: false,
    ...overrides,
  };
}

describe("useAnalyticsOptInPromptSteps", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should move to the preferences step and track manage preferences", () => {
    const setStep = jest.fn();
    const { result } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.onboarding,
          setStep,
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.onManagePreferencesClick();
    });

    expect(setStep).toHaveBeenCalledWith(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Manage Preferences",
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow: "consent onboarding",
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main,
      },
      true,
    );
  });

  it("should opt in and track accept all when analytics sharing is enabled", () => {
    const onSubmit = jest.fn();
    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.portfolio,
          setStep: jest.fn(),
          onSubmit,
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.handleShareAnalyticsChange(true);
    });

    const settings = store.getState().settings;
    expect(settings.shareAnalytics).toBe(true);
    expect(settings.sharePersonalizedRecommandations).toBe(true);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Accept All",
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow: "consent existing users",
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main,
      },
      true,
    );
  });

  it("should track refuse all without opting in when analytics sharing is disabled", () => {
    const onSubmit = jest.fn();
    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.onboarding,
          setStep: jest.fn(),
          onSubmit,
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.handleShareAnalyticsChange(false);
    });

    const settings = store.getState().settings;
    expect(settings.shareAnalytics).toBe(false);
    expect(settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Refuse All",
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow: "consent onboarding",
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.main,
      },
      true,
    );
  });

  it("should apply custom preferences and track share when confirmed", () => {
    const onSubmit = jest.fn();
    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.onboarding,
          setStep: jest.fn(),
          onSubmit,
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.handlePreferencesChange({
        [FieldKeySwitch.AnalyticsData]: true,
        [FieldKeySwitch.PersonalizationData]: false,
      });
    });

    act(() => {
      result.current.handleShareCustomAnalyticsChange(true);
    });

    const settings = store.getState().settings;
    expect(settings.shareAnalytics).toBe(true);
    expect(settings.sharePersonalizedRecommandations).toBe(false);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "Share",
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow: "consent onboarding",
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.preferences,
      },
      true,
    );
  });

  it("should track toggle changes on preferences", () => {
    const { result } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.onboarding,
          setStep: jest.fn(),
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.handlePreferencesChange({
        [FieldKeySwitch.AnalyticsData]: true,
        [FieldKeySwitch.PersonalizationData]: false,
      });
    });

    expect(track).toHaveBeenCalledWith(
      "toggle_clicked",
      {
        toggle: "Analytics",
        value: true,
        variant: ANALYTICS_OPT_IN_VARIANT,
        flow: "consent onboarding",
        page: ANALYTICS_OPT_IN_PROMPT_TRACKING_PAGES.preferences,
      },
      true,
    );
  });

  it("should not submit or track share when custom preferences are refused", () => {
    const onSubmit = jest.fn();
    const { result } = renderHook(
      () =>
        useAnalyticsOptInPromptSteps({
          entryPoint: EntryPoint.onboarding,
          setStep: jest.fn(),
          onSubmit,
        }),
      {
        initialState: {
          ...featureFlagsWithAnalyticsOptIn,
          settings: baseSettings(),
        },
      },
    );

    act(() => {
      result.current.handleShareCustomAnalyticsChange(false);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Share" }),
      expect.anything(),
    );
  });
});
