import { act, renderHook, waitFor } from "@tests/test-renderer";
import subDays from "date-fns/subDays";
import { NavigatorName, ScreenName } from "~/const";
import { track, updateIdentify } from "~/analytics";
import {
  ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
  ANALYTICS_CONSENT_DRAWER_FLOW,
  useAnalyticsConsentDrawerViewModel,
} from "../hooks/useAnalyticsConsentDrawerViewModel";
import { withConsentDrawerOpeningFresh, withConsentDrawerState } from "./helpers";

/** Fixed clock so `needsConsentRenewal` / consent ISO strings are deterministic. */
const FIXED_NOW = new Date("2024-01-15T12:00:00.000Z");

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

describe("useAnalyticsConsentDrawerViewModel", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_NOW);
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
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

    it("should keep drawer closed when consent exists however old the consent date is", async () => {
      const oldIso = subDays(FIXED_NOW, 3650).toISOString();
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: false,
          personalizedRecommendationsEnabled: false,
          privacyPolicyVersion: 1,
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
      expect(s.analyticsConsentInfo.privacyPolicyVersion).toBe("1.0");
      expect(s.analyticsConsentInfo.consentDate).not.toBeNull();
      expect(result.current.phase).toBe("closed");
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_opt_in",
          page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
          privacyPolicyVersion: "1.0",
        },
        true,
      );
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
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_opt_out",
          page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
          privacyPolicyVersion: "1.0",
        },
        true,
      );
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should navigate to analytics preferences and close when onSetPreferences is called", async () => {
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
        screen: ScreenName.AnalyticsPreferencesSettings,
        params: { initialTogglesOff: true },
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
          privacyPolicyVersion: 1,
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
          privacyPolicyVersion: 1,
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
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_opt_in",
          page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
          privacyPolicyVersion: "1.0",
        },
        true,
      );
      expect(updateIdentify).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should dispatch opt-out settings and close drawer when applyOptOut is called from consentReconfirm", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: 1,
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
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_opt_out",
          page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
          privacyPolicyVersion: "1.0",
        },
        true,
      );
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });
  });

  describe("needs privacy policy version update", () => {
    const withMinorBump = (consentDate: string) =>
      withConsentDrawerState({
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
        privacyPolicyVersion: 1,
        consentDate,
        analyticsOptInParams: { policyVersion: "1.1" },
      });

    it("should open privacy when only the minor version is newer and consent is current", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withMinorBump(new Date().toISOString()),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("privacy");
      });
    });

    it("should store the acknowledged version without refreshing the consent date", async () => {
      const consentDate = subDays(FIXED_NOW, 100).toISOString();
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withMinorBump(consentDate),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("privacy");
      });

      await act(async () => {
        await result.current.onPrivacyGotIt();
      });

      expect(result.current.phase).toBe("closed");
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(store.getState().settings.analyticsConsentInfo).toEqual({
        consentDate,
        privacyPolicyVersion: "1.1",
      });
      expect(updateIdentify).toHaveBeenCalled();
      expect(track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_privacy_got_it",
          page: ANALYTICS_CONSENT_DRAWER_ANALYTICS_PAGE,
          privacyPolicyVersion: "1.1",
        },
        true,
      );
      expect(track).toHaveBeenCalledWith("drawer_closed", drawerEventPayload);
    });

    it("should ask for a full renewal when a date-style flag policyVersion is bumped", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: 20260530,
          consentDate: new Date().toISOString(),
          analyticsOptInParams: { policyVersion: 20260531 },
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });
    });

    it("should keep the drawer closed when the remote policy version is invalid", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: 1,
          consentDate: new Date().toISOString(),
          analyticsOptInParams: { policyVersion: 1.2 },
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("closed");
      });
    });

    it("should keep the acknowledged version when the remote policy version is invalid", async () => {
      const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: "2.1",
          consentDate: null,
          analyticsOptInParams: { policyVersion: "v3" },
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });

      await act(async () => {
        await result.current.applyOptIn();
      });

      expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe("2.1");
    });
  });

  describe("when the stored consent date is corrupted", () => {
    it("should open consentReconfirm rather than trusting an unparseable date", async () => {
      const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
        overrideInitialState: withConsentDrawerState({
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          privacyPolicyVersion: 1,
          consentDate: "yesterday",
        }),
      });
      await waitFor(() => {
        expect(result.current.phase).toBe("consentReconfirm");
      });
    });
  });
});
