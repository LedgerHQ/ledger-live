import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
import * as analyticsConsentUtils from "@ledgerhq/live-common/analyticsConsentUtils";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_DIALOG_PAGE,
  useAnalyticsConsentDialogViewModel,
} from "../hooks/useAnalyticsConsentDialogViewModel";

const mockNavigate = jest.fn();
const mockUseMatch = jest.fn();

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useMatch: (args: unknown) => mockUseMatch(args),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: (url: string) => url,
}));

const dialogClosedPayload = {
  page: ANALYTICS_CONSENT_DIALOG_PAGE,
  flow: ANALYTICS_CONSENT_FLOW,
};

describe("useAnalyticsConsentDialogViewModel", () => {
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

  const consentReconfirmState = {
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
  };

  it("keeps phase closed when portfolio route is not focused", () => {
    mockUseMatch.mockReturnValue(null);
    const { result } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
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
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("opens consentReconfirm when renewal is needed, policy is current, and share analytics is on", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.phase).toBe("consentReconfirm");
    expect(result.current.isDialogOpen).toBe(true);
  });

  it("keeps modal closed when consent exists and time-based renewal is disabled (old consent date)", async () => {
    const renewalSpy = jest.spyOn(analyticsConsentUtils, "needsConsentRenewal").mockReturnValue(false);
    const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
    try {
      const { result } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
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
      expect(result.current.isDialogOpen).toBe(false);
    } finally {
      renewalSpy.mockRestore();
    }
  });

  it("dispatches opt-in and closes modal", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.phase).toBe("consentReconfirm");

    await act(async () => {
      await result.current.applyOptIn();
    });

    const s = store.getState().settings;
    expect(s.shareAnalytics).toBe(true);
    expect(s.sharePersonalizedRecommandations).toBe(true);
    expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
    expect(s.analyticsConsentInfo.privacyPolicyVersion).toBe(CURRENT_PRIVACY_POLICY_VERSION);
    expect(result.current.phase).toBe("closed");
  });

  it("tracks drawer_closed when leaving portfolio while modal is open", async () => {
    mockUseMatch.mockReturnValue({});
    const { result, rerender } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.phase).toBe("consentReconfirm");

    mockUseMatch.mockReturnValue(null);
    rerender(undefined);

    await act(async () => {
      await Promise.resolve();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("drawer_closed", dialogClosedPayload);
    expect(result.current.phase).toBe("closed");
  });

  it("navigates to settings display when Set preferences is used", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.onSetPreferences();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("drawer_closed", dialogClosedPayload);
    expect(mockNavigate).toHaveBeenCalledWith("/settings/display");
  });
});
