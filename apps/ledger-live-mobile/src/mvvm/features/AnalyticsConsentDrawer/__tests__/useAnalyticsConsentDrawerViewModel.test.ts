import { act, renderHook, waitFor } from "@tests/test-renderer";
import { NavigatorName, ScreenName } from "~/const";
import { track, updateIdentify } from "~/analytics";
import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";
import { useAnalyticsConsentDrawerViewModel } from "../useAnalyticsConsentDrawerViewModel";
import { ONE_YEAR_MS } from "../analyticsConsentDrawerLogic";
import { withConsentDrawerState } from "./helpers";

const mockNavigate = jest.fn();
const mockUseIsFocused = jest.fn(() => true);

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
  useIsFocused: () => mockUseIsFocused(),
}));

describe("useAnalyticsConsentDrawerViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsFocused.mockReturnValue(true);
  });

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

  it("should open consentReconfirm when toggles are off, policy is current, and consent is missing", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: false,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        consentDate: null,
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentReconfirm");
    });
    expect(result.current.isDrawerOpen).toBe(true);
    expect(track).toHaveBeenCalledWith("modal_opened", {
      modal: "Analytics consent drawer",
    });
  });

  it("should open consentFresh when both toggles are on even if privacy policy version is stale (phase order)", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: true,
        personalizedRecommendationsEnabled: true,
        privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
        consentDate: new Date().toISOString(),
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });
  });

  it("should open consentReconfirm when toggles are off, policy is current, and consent is older than one year", async () => {
    const oldIso = new Date(Date.now() - ONE_YEAR_MS - 86_400_000).toISOString();
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: false,
        privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
        consentDate: oldIso,
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentReconfirm");
    });
  });

  it("should close phase when focus is lost after being open", async () => {
    const { result, rerender } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState(),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });
    mockUseIsFocused.mockReturnValue(false);
    rerender({});
    await waitFor(() => {
      expect(result.current.phase).toBe("closed");
    });
  });

  it("should dispatch opt-in settings and close drawer when applyOptIn is called", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState(),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });

    act(() => {
      result.current.applyOptIn();
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
      page: "Analytics consent drawer",
    });
    expect(updateIdentify).toHaveBeenCalled();
  });

  it("should dispatch opt-out settings and close drawer when applyOptOut is called", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState(),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });

    act(() => {
      result.current.applyOptOut();
    });

    const s = store.getState().settings;
    expect(s.analyticsEnabled).toBe(false);
    expect(s.personalizedRecommendationsEnabled).toBe(false);
    expect(s.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(result.current.phase).toBe("closed");
    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "analytics_consent_opt_out",
      page: "Analytics consent drawer",
    });
  });

  it("should close drawer after privacy got it when consent is still valid", async () => {
    const { result, store } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState({
        analyticsEnabled: false,
        personalizedRecommendationsEnabled: true,
        privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
        consentDate: new Date().toISOString(),
      }),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("privacy");
    });

    act(() => {
      result.current.onPrivacyGotIt();
    });

    expect(result.current.phase).toBe("closed");
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(
      CURRENT_PRIVACY_POLICY_VERSION,
    );
  });

  it("should navigate to General settings and close when onSetPreferences is called", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState(),
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
      page: "Analytics consent drawer",
    });
  });

  it("should close drawer when handleCloseDrawer is called", async () => {
    const { result } = renderHook(() => useAnalyticsConsentDrawerViewModel(), {
      overrideInitialState: withConsentDrawerState(),
    });
    await waitFor(() => {
      expect(result.current.phase).toBe("consentFresh");
    });

    act(() => {
      result.current.handleCloseDrawer();
    });

    expect(result.current.phase).toBe("closed");
  });
});
