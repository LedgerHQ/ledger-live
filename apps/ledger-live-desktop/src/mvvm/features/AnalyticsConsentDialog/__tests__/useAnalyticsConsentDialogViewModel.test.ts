import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_DIALOG_PAGE,
  useAnalyticsConsentDialogViewModel,
} from "../hooks/useAnalyticsConsentDialogViewModel";

const mockUseMatch = jest.fn();

/** Frozen clock; consent offsets align with `needsConsentRenewal` in live-common (`analyticsConsentUtils`). */
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

const featureFlagsWithAnalyticsOptIn = {
  ...FEATURE_FLAGS_INITIAL_STATE,
  overrides: {
    ...FEATURE_FLAGS_INITIAL_STATE.overrides,
    analyticsOptIn: {
      ...(FEATURE_FLAGS_INITIAL_STATE.overrides.analyticsOptIn ?? {}),
      enabled: true,
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

const renderViewModel = (settings: SettingsOverrides = {}) =>
  renderHook(() => useAnalyticsConsentDialogViewModel(), {
    initialState: {
      featureFlags: featureFlagsWithAnalyticsOptIn,
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

  it("keeps modal closed when consent is still within the renewal window", () => {
    const consentWithinWindow = new Date(FIXED_NOW);
    consentWithinWindow.setUTCDate(consentWithinWindow.getUTCDate() - 300);

    const { result } = renderViewModel({
      shareAnalytics: false,
      sharePersonalizedRecommandations: false,
      analyticsConsentInfo: {
        consentDate: consentWithinWindow.toISOString(),
        privacyPolicyVersion: 1,
      },
    });

    expectClosed(result.current);
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
    expect(settings.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
    expectClosed(result.current);
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
