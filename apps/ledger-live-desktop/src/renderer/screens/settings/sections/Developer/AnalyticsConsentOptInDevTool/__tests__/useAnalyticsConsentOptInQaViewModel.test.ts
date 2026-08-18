import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import {
  formatBareValue,
  scenarioConfirmMessage,
  useAnalyticsConsentOptInQaViewModel,
} from "../useAnalyticsConsentOptInQaViewModel";

const analyticsOptInOverrides = {
  ...FEATURE_FLAGS_INITIAL_STATE.overrides,
  analyticsOptIn: {
    ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn,
    ...(FEATURE_FLAGS_INITIAL_STATE.overrides.analyticsOptIn ?? {}),
    enabled: true,
    params: {
      ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params,
      policyVersion: "1.0",
    },
  },
};

const featureFlagsWithAnalyticsOptIn = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: analyticsOptInOverrides,
  resolved: { ...FEATURE_FLAGS_DEFAULTS, ...analyticsOptInOverrides },
};

const defaultSettings = {
  ...INITIAL_STATE,
  hasCompletedOnboarding: true,
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  hasSeenAnalyticsOptInPrompt: true,
  analyticsConsentInfo: {
    consentDate: "2024-05-01T12:00:00.000Z",
    privacyPolicyVersion: "1.0",
  },
};

const renderViewModel = (
  settings: Partial<typeof defaultSettings> = {},
  featureFlags = featureFlagsWithAnalyticsOptIn,
) =>
  renderHook(() => useAnalyticsConsentOptInQaViewModel(), {
    initialState: {
      featureFlags,
      settings: {
        ...defaultSettings,
        ...settings,
        analyticsConsentInfo: {
          ...defaultSettings.analyticsConsentInfo,
          ...(settings.analyticsConsentInfo ?? {}),
        },
      },
    },
  });

describe("useAnalyticsConsentOptInQaViewModel", () => {
  it("reports Quiet when consent matches remote policy", () => {
    const { result } = renderViewModel();

    expect(result.current.headline).toBe("No drawer");
    expect(result.current.isEligibleForDrawer).toBe(false);
    expect(result.current.reasonLabel).toBe("Consent matches policy");
    expect(result.current.storedFields[0]?.status).toEqual({ label: "Valid", tone: "success" });
  });

  it("reports Full reconsent on a major policy bump scenario", () => {
    const { result, store } = renderViewModel();
    const major = result.current.scenariosByGroup
      .flatMap(group => group.scenarios)
      .find(scenario => scenario.id === "major-bump");

    expect(major).toBeDefined();

    act(() => {
      result.current.applyScenario(major!);
    });

    const state = store.getState();
    expect(state.featureFlags.overrides.analyticsOptIn?.params?.policyVersion).toBe("2.0");
    expect(state.settings.analyticsConsentInfo.privacyPolicyVersion).toBe("1.0");
    expect(result.current.headline).toBe("Full reconsent");
    expect(result.current.isEligibleForDrawer).toBe(true);
    expect(result.current.trackingPausedUntilAnswered).toBe(true);
    expect(result.current.storedFields[0]?.status).toEqual({
      label: "Valid · outdated",
      tone: "warning",
    });
  });

  it("reports Privacy only on a minor policy bump scenario", () => {
    const { result } = renderViewModel();
    const minor = result.current.scenariosByGroup
      .flatMap(group => group.scenarios)
      .find(scenario => scenario.id === "minor-bump");

    act(() => {
      result.current.applyScenario(minor!);
    });

    expect(result.current.headline).toBe("Privacy only");
    expect(result.current.isEligibleForDrawer).toBe(true);
    expect(result.current.trackingPausedUntilAnswered).toBe(false);
  });

  it("keeps stored policy version on the no-consent scenario", () => {
    const { result, store } = renderViewModel({
      analyticsConsentInfo: {
        consentDate: "2024-05-01T12:00:00.000Z",
        privacyPolicyVersion: "1.0",
      },
    });
    const firstTime = result.current.scenariosByGroup
      .flatMap(group => group.scenarios)
      .find(scenario => scenario.id === "first-time");

    act(() => {
      result.current.applyScenario(firstTime!);
    });

    expect(store.getState().settings.analyticsConsentInfo).toEqual({
      consentDate: null,
      privacyPolicyVersion: "1.0",
    });
    expect(result.current.headline).toBe("Full reconsent");
  });

  it("resets consent, preferences, and the feature flag override", () => {
    const { result, store } = renderViewModel();
    const major = result.current.scenariosByGroup
      .flatMap(group => group.scenarios)
      .find(scenario => scenario.id === "major-bump");

    act(() => {
      result.current.applyScenario(major!);
    });
    act(() => {
      result.current.onResetAll();
    });

    const state = store.getState();
    expect(state.featureFlags.overrides.analyticsOptIn).toBeUndefined();
    expect(state.settings.analyticsConsentInfo).toEqual({
      consentDate: null,
      privacyPolicyVersion: null,
    });
    expect(state.settings.shareAnalytics).toBe(false);
    expect(state.settings.sharePersonalizedRecommandations).toBe(false);
    expect(state.settings.hasSeenAnalyticsOptInPrompt).toBe(false);
    expect(result.current.isAlreadyReset).toBe(true);
  });

  it("blocks preview when the feature flag is off", () => {
    const { result } = renderViewModel(
      {},
      {
        ...featureFlagsWithAnalyticsOptIn,
        overrides: {
          ...analyticsOptInOverrides,
          analyticsOptIn: {
            ...analyticsOptInOverrides.analyticsOptIn,
            enabled: false,
          },
        },
        resolved: {
          ...FEATURE_FLAGS_DEFAULTS,
          ...analyticsOptInOverrides,
          analyticsOptIn: {
            ...analyticsOptInOverrides.analyticsOptIn,
            enabled: false,
          },
        },
      },
    );

    expect(result.current.headline).toBe("Blocked — no drawer");
    expect(result.current.isEligibleForDrawer).toBe(false);
    expect(result.current.reasonLabel).toBe("Feature flag disabled");
  });

  it("mounts preview in place without navigating away", () => {
    const { result } = renderViewModel();
    const major = result.current.scenariosByGroup
      .flatMap(group => group.scenarios)
      .find(scenario => scenario.id === "major-bump");

    act(() => {
      result.current.applyScenario(major!);
    });
    act(() => {
      result.current.onPreviewDialog();
    });

    expect(result.current.isPreviewMounted).toBe(true);
    expect(result.current.previewKey).toBe(1);
  });
});

describe("scenarioConfirmMessage / formatBareValue", () => {
  it("includes the expected verdict title", () => {
    const message = scenarioConfirmMessage({
      id: "up-to-date",
      name: "Up to date",
      expected: "Quiet",
      summary: "Policy matches consent → no drawer",
      remotePolicy: "matchBaseline",
      storedPolicy: "matchBaseline",
      consentDate: { kind: "daysAgo", days: 28 },
      analyticsEnabled: true,
      hasSeenPrompt: true,
    });

    expect(message).toContain("No drawer");
    expect(message).toContain("Policy matches consent → no drawer");
  });

  it("stringifies inspector raw values", () => {
    expect(formatBareValue(null)).toBe("null");
    expect(formatBareValue("1.0")).toBe('"1.0"');
  });
});
