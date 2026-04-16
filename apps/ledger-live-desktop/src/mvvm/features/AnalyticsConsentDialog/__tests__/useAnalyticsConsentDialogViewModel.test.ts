import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";
import { act, renderHook } from "tests/testSetup";
<<<<<<< Updated upstream
import * as analyticsConsentUtils from "@ledgerhq/live-common/analyticsConsent/index";
=======
import { CONSENT_RENEWAL_INTERVAL_MS } from "@ledgerhq/live-common/analyticsConsentUtils";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
>>>>>>> Stashed changes
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import {
  ANALYTICS_CONSENT_FLOW,
  ANALYTICS_CONSENT_DIALOG_PAGE,
  useAnalyticsConsentDialogViewModel,
} from "../hooks/useAnalyticsConsentDialogViewModel";

const mockUseMatch = jest.fn();

/** Frozen clock; consent offsets align with `needsConsentRenewal` (interval from live-common). */
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

describe("useAnalyticsConsentDialogViewModel", () => {
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

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
    jest.clearAllMocks();
    mockUseMatch.mockReturnValue({});
  });

  afterEach(() => {
    jest.useRealTimers();
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
        privacyPolicyVersion: 1,
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
            privacyPolicyVersion: 1,
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
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current.phase).toBe("consentReconfirm");
    expect(result.current.isDialogOpen).toBe(true);
  });

<<<<<<< Updated upstream
  it("keeps modal closed when consent exists and time-based renewal is disabled (old consent date)", async () => {
    const renewalSpy = jest
      .spyOn(analyticsConsentUtils, "needsConsentRenewal")
      .mockReturnValue(false);
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
              privacyPolicyVersion: 1,
            },
=======
  it("keeps modal closed when consent is still within the renewal window and policy is current", async () => {
    const consentStillValidIso = new Date(
      FIXED_NOW.getTime() - CONSENT_RENEWAL_INTERVAL_MS + 86_400_000,
    ).toISOString();

    const { result } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: {
        featureFlags: featureFlagsWithAnalyticsOptIn,
        settings: {
          ...INITIAL_STATE,
          hasCompletedOnboarding: true,
          shareAnalytics: false,
          sharePersonalizedRecommandations: false,
          analyticsConsentInfo: {
            consentDate: consentStillValidIso,
            privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
>>>>>>> Stashed changes
          },
        },
      },
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current.phase).toBe("closed");
    expect(result.current.isDialogOpen).toBe(false);
  });

  it("dispatches opt-in and closes modal", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(result.current.phase).toBe("consentReconfirm");

    await act(async () => {
      await result.current.applyOptIn();
    });

    const s = store.getState().settings;
    expect(s.shareAnalytics).toBe(true);
    expect(s.sharePersonalizedRecommandations).toBe(true);
    expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
    expect(s.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
    expect(result.current.phase).toBe("closed");
  });

  it("tracks drawer_closed when leaving portfolio while modal is open", async () => {
    mockUseMatch.mockReturnValue({});
    const { result, rerender } = renderHook(() => useAnalyticsConsentDialogViewModel(), {
      initialState: consentReconfirmState,
    });

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });
    expect(result.current.phase).toBe("consentReconfirm");

    mockUseMatch.mockReturnValue(null);
    rerender(undefined);

    await act(async () => {
      await jest.runOnlyPendingTimersAsync();
    });

    expect(jest.mocked(track)).toHaveBeenCalledWith("drawer_closed", dialogClosedPayload);
    expect(result.current.phase).toBe("closed");
  });
});
