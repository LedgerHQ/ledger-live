import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { useAnalyticsConsentModalViewModel } from "../useAnalyticsConsentModalViewModel";

const mockNavigate = jest.fn();
const mockUseMatch = jest.fn();

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useMatch: (args: unknown) => mockUseMatch(args),
}));

describe("useAnalyticsConsentModalViewModel", () => {
  const featureFlagsWithAnalyticsOptIn = {
    ...FEATURE_FLAGS_INITIAL_STATE,
    overrides: {
      ...FEATURE_FLAGS_INITIAL_STATE.overrides,
      analyticsOptIn: { enabled: true },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMatch.mockReturnValue({});
  });

  it("keeps phase closed when portfolio route is not focused", () => {
    mockUseMatch.mockReturnValue(null);
    const { result } = renderHook(() => useAnalyticsConsentModalViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          analyticsConsentInfo: {
            consentDate: null,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
        },
      },
    });
    expect(result.current.phase).toBe("closed");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("opens consentReconfirm when renewal is needed, policy is current, and share analytics is on", async () => {
    const { result } = renderHook(() => useAnalyticsConsentModalViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          analyticsConsentInfo: {
            consentDate: null,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.phase).toBe("consentReconfirm");
    expect(result.current.isModalOpen).toBe(true);
  });

  it("keeps modal closed when consent exists and time-based renewal is disabled (old consent date)", async () => {
    const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
    const { result } = renderHook(() => useAnalyticsConsentModalViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
          analyticsConsentInfo: {
            consentDate: oldIso,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.phase).toBe("closed");
    expect(result.current.isModalOpen).toBe(false);
  });

  it("dispatches opt-in and closes modal", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentModalViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          analyticsConsentInfo: {
            consentDate: null,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.phase).toBe("consentReconfirm");

    act(() => {
      result.current.applyOptIn();
    });

    const s = store.getState().settings;
    expect(s.shareAnalytics).toBe(true);
    expect(s.sharePersonalizedRecommandations).toBe(true);
    expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
    expect(s.analyticsConsentInfo.privacyPolicyVersion).toBe(CURRENT_PRIVACY_POLICY_VERSION);
    expect(result.current.phase).toBe("closed");
  });

  it("navigates to settings display when Set preferences is used", async () => {
    const { result } = renderHook(() => useAnalyticsConsentModalViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: true,
          sharePersonalizedRecommandations: true,
          analyticsConsentInfo: {
            consentDate: null,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          },
        },
      },
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.onSetPreferences();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/settings/display");
  });
});
