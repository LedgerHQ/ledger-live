import { act, renderHook, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { track, updateIdentify } from "~/analytics";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import * as analyticsConsentUtils from "@ledgerhq/live-common/analyticsConsentUtils";
import {
  ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
  ANALYTICS_CONSENT_DRAWER_FLOW,
  useAnalyticsConsentDrawerViewModel,
} from "../hooks/useAnalyticsConsentDrawerViewModel";
import { withConsentDrawerOpeningFresh, withConsentDrawerState } from "./helpers";
import { needsConsentRenewalTestImpl } from "./needsConsentRenewalTestImpl";

const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const drawerEventPayload = {
  page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
  flow: ANALYTICS_CONSENT_DRAWER_FLOW,
};

const mockNavigate = jest.fn();
const mockUseIsFocused = jest.fn(() => true);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useIsFocused: () => mockUseIsFocused(),
}));

/** Forces default renewal interval (matches production `null` vs yearly `YEAR_MS`) without `requireActual` recursion. */
function stubNeedsConsentRenewalDefaultInterval(renewalIntervalMsWhenOmitted: number | null) {
  jest.spyOn(analyticsConsentUtils, "needsConsentRenewal").mockImplementation(
    (consentDateIso, now = Date.now(), interval) =>
      needsConsentRenewalTestImpl(
        consentDateIso,
        now,
        interval !== undefined ? interval : renewalIntervalMsWhenOmitted,
      ),
  );
}

describe("useAnalyticsConsentDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
    stubNeedsConsentRenewalDefaultInterval(null);
  });

  describe("when the drawer should stay closed", () => {
    it("should keep phase closed when screen is not focused", () => {
      mockUseIsFocused.mockReturnValue(false);
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState(),
      });
      expect(result.current.phase).toBe("closed");
      expect(result.current.isDrawerOpen).toBe(false);
    });

    it("should keep phase closed when onboarding is not completed", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({ hasCompletedOnboarding: false }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("closed");
      });
    });

    it("should keep phase closed when analyticsOptIn feature is disabled", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({ analyticsOptInEnabled: false }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("closed");
      });
    });

    it("should keep drawer closed when consent exists and time-based renewal is disabled (old consent date)", async () => {
      const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: false,
          personalizedRecommendationsEnabled: false,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: oldIso,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("closed");
      });
    });
  });

  describe("needs fresh consent", () => {
    it("should close phase when focus is lost after being open", async () => {
      const { result, rerender } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerOpeningFresh(),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });
      mockUseIsFocused.mockReturnValue(false);
      rerender({});
      await waitFor(() => {
        expect(result.current.phase).toBe("closed");
      });
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should dispatch opt-in settings and close drawer when applyOptIn is called", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerOpeningFresh(),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });

      await act(async () => {
        await result.current.applyOptIn();
      });

      const s = store.getState().settings;
      expect(s.analyticsEnabled).toBe(true);
      expect(s.personalizedRecommendationsEnabled).toBe(true);
      expect(s.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(s.analyticsConsentInfo.privacyPolicyVersion).toBe(CURRENT_PRIVACY_POLICY_VERSION);
      expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
      expect(result.current.phase).toBe("closed");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "analytics_consent_opt_in",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
      });
      expect(updateIdentify).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should dispatch opt-out settings and close drawer when applyOptOut is called", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerOpeningFresh(),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });

      await act(async () => {
        await result.current.applyOptOut();
      });

      const s = store.getState().settings;
      expect(s.analyticsEnabled).toBe(false);
      expect(s.personalizedRecommendationsEnabled).toBe(false);
      expect(s.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(result.current.phase).toBe("closed");
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "analytics_consent_opt_out",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
      });
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should navigate to General settings and close when onSetPreferences is called", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerOpeningFresh(),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });

      act(() => {
        result.current.onSetPreferences();
      });

      expect(result.current.phase).toBe("closed");
      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Settings, {
        screen: ScreenName.GeneralSettings,
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "analytics_consent_set_preferences",
        page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
      });
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should close drawer when handleCloseDrawer is called", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerOpeningFresh(),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });

      act(() => {
        result.current.handleCloseDrawer();
      });

      expect(result.current.phase).toBe("closed");
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });
  });

  describe("needs reconfirmation", () => {
    it("should open consentReconfirm when renewal is needed, policy is current, and analytics is on", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: null,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });
      expect(result.current.isDrawerOpen).toBe(true);
    });

    it("should dispatch opt-in settings and close drawer when applyOptIn is called from consentReconfirm", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: null,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });

      await act(async () => {
        await result.current.applyOptIn();
      });

      const s = store.getState().settings;
      expect(s.analyticsEnabled).toBe(true);
      expect(s.personalizedRecommendationsEnabled).toBe(true);
      expect(s.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(result.current.phase).toBe("closed");
      expect(updateIdentify).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should dispatch opt-out settings and close drawer when applyOptOut is called from consentReconfirm", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: null,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });

      await act(async () => {
        await result.current.applyOptOut();
      });

      expect(store.getState().settings.analyticsEnabled).toBe(false);
      expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(result.current.phase).toBe("closed");
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });
  });

  describe("needs privacy policy version update", () => {
    it("should open privacy when policy is stale, consent is current, and analytics is on", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
          consentDate: new Date().toISOString(),
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("privacy");
      });
    });

    it("should close drawer after privacy got it when consent is still valid", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
          consentDate: new Date().toISOString(),
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("privacy");
      });

      await act(async () => {
        await result.current.onPrivacyGotIt();
      });

      expect(result.current.phase).toBe("closed");
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(
        CURRENT_PRIVACY_POLICY_VERSION,
      );
      expect(updateIdentify).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });
  });

  describe("when yearly time-based renewal applies (needsConsentRenewal forced to 365d)", () => {
    beforeEach(() => {
      stubNeedsConsentRenewalDefaultInterval(YEAR_MS);
    });

    it("should open consentFresh when consent is stale by time and analytics is off", async () => {
      const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: false,
          personalizedRecommendationsEnabled: false,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: oldIso,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentFresh");
      });
    });

    it("should open consentReconfirm when consent is stale by time even if both toggles are on (renewal first)", async () => {
      const oldIso = new Date(Date.now() - YEAR_MS - 86_400_000).toISOString();
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
          consentDate: oldIso,
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });
    });
  });
});
