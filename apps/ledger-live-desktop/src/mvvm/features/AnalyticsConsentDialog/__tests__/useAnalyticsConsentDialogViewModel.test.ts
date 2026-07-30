import { FEATURE_FLAGS_DEFAULTS, FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_DIALOG_PAGE,
  useAnalyticsConsentDialogViewModel,
} from "../hooks/useAnalyticsConsentDialogViewModel";

const mockUseMatch = jest.fn();

const FIXED_NOW = new Date("2024-06-15T12:00:00.000Z");

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useMatch: (args: unknown) => mockUseMatch(args),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

const dialogClosedPayload = {
  page: ANALYTICS_CONSENT_DIALOG_PAGE,
  flow: ANALYTICS_CONSENT_FLOW,
};

type ViewModel = ReturnType<typeof useAnalyticsConsentDialogViewModel>;
type SettingsState = typeof INITIAL_STATE;
type SettingsOverrides = Partial<SettingsState> & {
  analyticsConsentInfo?: Partial<SettingsState["analyticsConsentInfo"]>;
};

const analyticsOptInOverrides = {
  ...FEATURE_FLAGS_INITIAL_STATE.overrides,
  analyticsOptIn: {
    ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn,
    ...(FEATURE_FLAGS_INITIAL_STATE.overrides.analyticsOptIn ?? {}),
    enabled: true,
  },
};
const featureFlagsWithAnalyticsOptIn = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: analyticsOptInOverrides,
  // Mirror slice resolution so hooks reading from `resolved` see the override.
  resolved: { ...FEATURE_FLAGS_DEFAULTS, ...analyticsOptInOverrides },
};

const featureFlagsWithMinorBump = {
  ...featureFlagsWithAnalyticsOptIn,
  overrides: {
    ...analyticsOptInOverrides,
    analyticsOptIn: {
      ...analyticsOptInOverrides.analyticsOptIn,
      params: {
        ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params,
        policyVersion: "1.1",
        consentValidityDays:
          FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params?.consentValidityDays ?? 365,
      },
    },
  },
  resolved: {
    ...FEATURE_FLAGS_DEFAULTS,
    ...analyticsOptInOverrides,
    analyticsOptIn: {
      ...analyticsOptInOverrides.analyticsOptIn,
      params: {
        ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params,
        policyVersion: "1.1",
        consentValidityDays:
          FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params?.consentValidityDays ?? 365,
      },
    },
  },
};

const defaultSettings: SettingsState = {
  ...INITIAL_STATE,
  hasCompletedOnboarding: true,
  shareAnalytics: true,
  sharePersonalizedRecommandations: true,
  analyticsConsentInfo: {
    consentDate: null,
    privacyPolicyVersion: 1,
  },
};

const flushEffects = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderViewModel = (
  settings: SettingsOverrides = {},
  featureFlags = featureFlagsWithAnalyticsOptIn,
) =>
  renderHook(() => useAnalyticsConsentDialogViewModel(), {
    initialState: {
      featureFlags,
      settings: {
        ...defaultSettings,
        ...settings,
        analyticsConsentInfo: {
          ...defaultSettings.analyticsConsentInfo,
          ...settings.analyticsConsentInfo,
        },
      },
    },
  });

const expectClosed = (viewModel: ViewModel) => {
  expect(viewModel.phase).toBe("closed");
  expect(viewModel.isDialogOpen).toBe(false);
};

const expectConsentReconfirm = (viewModel: ViewModel) => {
  expect(viewModel.phase).toBe("consentReconfirm");
  expect(viewModel.isDialogOpen).toBe(true);
};

const renderReconfirmViewModel = () => renderViewModel();

describe("useAnalyticsConsentDialogViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    jest.setSystemTime(FIXED_NOW);
    jest.clearAllMocks();
    mockUseMatch.mockReturnValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("keeps phase closed when portfolio route is not focused", () => {
    mockUseMatch.mockReturnValue(null);
    const { result } = renderReconfirmViewModel();

    expectClosed(result.current);
  });

  it("opens consentReconfirm when renewal is needed, policy is current, and share analytics is on", async () => {
    const { result } = renderReconfirmViewModel();

    await flushEffects();
    expectConsentReconfirm(result.current);
  });

  it("keeps modal closed when consent is up to date", () => {
    const { result } = renderViewModel({
      shareAnalytics: false,
      sharePersonalizedRecommandations: false,
      analyticsConsentInfo: {
        consentDate: FIXED_NOW.toISOString(),
        privacyPolicyVersion: 1,
      },
    });

    expectClosed(result.current);
  });

  it("opens consentReconfirm on a major policyVersion bump", async () => {
    const { result } = renderViewModel(
      {
        analyticsConsentInfo: {
          consentDate: FIXED_NOW.toISOString(),
          privacyPolicyVersion: "1.0",
        },
      },
      {
        ...featureFlagsWithAnalyticsOptIn,
        overrides: {
          ...analyticsOptInOverrides,
          analyticsOptIn: {
            ...analyticsOptInOverrides.analyticsOptIn,
            params: {
              ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params,
              policyVersion: "2.0",
              consentValidityDays:
                FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params?.consentValidityDays ?? 365,
            },
          },
        },
        resolved: {
          ...FEATURE_FLAGS_DEFAULTS,
          ...analyticsOptInOverrides,
          analyticsOptIn: {
            ...analyticsOptInOverrides.analyticsOptIn,
            params: {
              ...FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params,
              policyVersion: "2.0",
              consentValidityDays:
                FEATURE_FLAGS_DEFAULTS.analyticsOptIn.params?.consentValidityDays ?? 365,
            },
          },
        },
      },
    );

    await flushEffects();
    expectConsentReconfirm(result.current);
  });

  it("dispatches opt-in and closes modal", async () => {
    const { result, store } = renderReconfirmViewModel();

    await flushEffects();
    expectConsentReconfirm(result.current);

    await act(async () => {
      await result.current.applyOptIn();
    });

    const settings = store.getState().settings;
    expect(settings.shareAnalytics).toBe(true);
    expect(settings.sharePersonalizedRecommandations).toBe(true);
    expect(settings.analyticsConsentInfo.consentDate).not.toBeNull();
    expect(settings.analyticsConsentInfo.privacyPolicyVersion).toBe("1.0");
    expectClosed(result.current);
  });

  it("tracks opt-out as mandatory when user was already fully opted out", async () => {
    const { result } = renderViewModel({
      shareAnalytics: false,
      sharePersonalizedRecommandations: false,
      analyticsConsentInfo: {
        consentDate: null,
        privacyPolicyVersion: 1,
      },
    });

    await flushEffects();
    expect(result.current.phase).toBe("consentFresh");

    await act(async () => {
      await result.current.applyOptOut();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "analytics_consent_opt_out",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: "1.0",
      },
      true,
    );
  });

  it("tracks privacy acknowledgement as mandatory and preserves consentDate", async () => {
    const consentDate = FIXED_NOW.toISOString();
    const { result, store } = renderViewModel(
      {
        analyticsConsentInfo: {
          consentDate,
          privacyPolicyVersion: "1.0",
        },
      },
      featureFlagsWithMinorBump,
    );

    await flushEffects();
    expect(result.current.phase).toBe("privacy");

    await act(async () => {
      await result.current.onPrivacyGotIt();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "analytics_consent_privacy_got_it",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: "1.1",
      },
      true,
    );
    expect(store.getState().settings.analyticsConsentInfo.consentDate).toBe(consentDate);
    expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe("1.1");
  });

  it("tracks preferences confirmation as mandatory", async () => {
    const { result } = renderReconfirmViewModel();

    await flushEffects();
    expectConsentReconfirm(result.current);

    act(() => {
      result.current.onSetPreferences();
    });

    await act(async () => {
      await result.current.applyPreferences();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith(
      "button_clicked",
      {
        button: "analytics_consent_preferences_confirm",
        page: ANALYTICS_CONSENT_DIALOG_PAGE,
        privacyPolicyVersion: "1.0",
      },
      true,
    );
  });

  it("tracks drawer_closed when leaving portfolio while modal is open", async () => {
    const { result, rerender } = renderReconfirmViewModel();

    await flushEffects();
    expectConsentReconfirm(result.current);

    act(() => {
      mockUseMatch.mockReturnValue(null);
      rerender(undefined);
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("drawer_closed", dialogClosedPayload);
    expectClosed(result.current);
  });
});
