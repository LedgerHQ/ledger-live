import React from "react";
import { Linking, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { InitialState } from "@react-navigation/native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { DEFAULT_FEATURES } from "@ledgerhq/live-common/featureFlags/index";
import { resolveAnalyticsOptInParams } from "@ledgerhq/live-common/analyticsConsent/index";
import * as analytics from "~/analytics";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AnalyticsPreferencesSettings from "../index";

const Stack = createNativeStackNavigator();

function GeneralSettingsStub() {
  return <View testID="analytics-preferences-general-settings-stub" />;
}

function createSettingsStackInitialState(
  params?: Readonly<{ initialTogglesOff?: boolean }>,
): InitialState {
  return {
    routes: [
      { name: ScreenName.GeneralSettings },
      {
        name: ScreenName.AnalyticsPreferencesSettings,
        ...(params !== undefined ? { params } : {}),
      },
    ],
    index: 1,
  };
}

function SettingsTestStack() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={ScreenName.GeneralSettings} component={GeneralSettingsStub} />
        <Stack.Screen name={ScreenName.AnalyticsPreferencesSettings} component={AnalyticsPreferencesSettings} />
      </Stack.Navigator>
    </SafeAreaProvider>
  );
}

type RenderOptions = Readonly<{
  params?: Readonly<{ initialTogglesOff?: boolean }>;
  overrideInitialState?: (state: State) => State;
}>;

function renderAnalyticsPreferencesSettings(options: RenderOptions = {}) {
  const { params, overrideInitialState } = options;

  return render(<SettingsTestStack />, {
    ...(overrideInitialState ? { overrideInitialState } : {}),
    navigationInitialState: createSettingsStackInitialState(params),
  });
}

const { policyVersion: expectedPrivacyPolicyVersion } = resolveAnalyticsOptInParams(
  DEFAULT_FEATURES.analyticsOptIn,
);

describe("AnalyticsPreferencesSettings", () => {
  let trackSpy: jest.SpiedFunction<typeof analytics.track>;
  let updateIdentifySpy: jest.SpiedFunction<typeof analytics.updateIdentify>;

  beforeEach(() => {
    jest.clearAllMocks();
    trackSpy = jest.spyOn(analytics, "track").mockResolvedValue(undefined);
    updateIdentifySpy = jest.spyOn(analytics, "updateIdentify").mockResolvedValue(undefined);
  });

  afterEach(() => {
    trackSpy.mockRestore();
    updateIdentifySpy.mockRestore();
  });

  describe("rendering", () => {
    it("shows title and confirm CTA", () => {
      renderAnalyticsPreferencesSettings();

      expect(screen.getByTestId("analytics-preferences-screen-title")).toHaveTextContent("Set preferences");
      expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
    });

    it("initializes switches from Redux when route omits initialTogglesOff", () => {
      renderAnalyticsPreferencesSettings({
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: true,
          },
        }),
      });

      const [appPerformanceSwitch, personalizedSwitch] = screen.getAllByRole("switch");
      expect(appPerformanceSwitch.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: false }),
      );
      expect(personalizedSwitch.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: true }),
      );
    });

    it("forces both switches off when route sets initialTogglesOff despite store defaults", () => {
      renderAnalyticsPreferencesSettings({
        params: { initialTogglesOff: true },
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: true,
          },
        }),
      });

      const [appPerformanceSwitch, personalizedSwitch] = screen.getAllByRole("switch");
      expect(appPerformanceSwitch.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: false }),
      );
      expect(personalizedSwitch.props.accessibilityState).toEqual(
        expect.objectContaining({ checked: false }),
      );
    });
  });

  describe("footer", () => {
    it("opens the privacy policy URL when the footer link is pressed", async () => {
      const openSpy = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
      try {
        const { user } = renderAnalyticsPreferencesSettings();

        await user.press(screen.getByRole("link", { name: "Privacy policy" }));

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(String(openSpy.mock.calls[0][0])).toMatch(/^https?:\/\//);
      } finally {
        openSpy.mockRestore();
      }
    });
  });

  describe("confirm", () => {
    it("persists toggles, consent metadata, analytics, identify, and navigates back", async () => {
      const { store, user } = renderAnalyticsPreferencesSettings({
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: false,
          },
        }),
      });

      await user.press(screen.getByRole("switch", { checked: true }));
      await user.press(screen.getAllByRole("switch")[1]);

      await user.press(screen.getByRole("button", { name: "Confirm" }));

      const settings = store.getState().settings;
      expect(settings.analyticsEnabled).toBe(false);
      expect(settings.personalizedRecommendationsEnabled).toBe(true);
      expect(settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(settings.analyticsConsentInfo.privacyPolicyVersion).toBe(expectedPrivacyPolicyVersion);

      const consentDate = settings.analyticsConsentInfo.consentDate;
      expect(consentDate).toEqual(expect.any(String));
      expect(Number.isNaN(Date.parse(consentDate!))).toBe(false);

      expect(analytics.track).toHaveBeenCalledTimes(1);
      expect(analytics.track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          button: "analytics_preferences_confirm",
          page: "Analytics preferences settings",
          appPerformance: false,
          personalizedExperience: true,
        }),
        true,
      );
      expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      expect(analytics.updateIdentify).toHaveBeenCalledWith(undefined, true);

      await waitFor(() => {
        expect(screen.queryByTestId("analytics-preferences-screen-title")).toBeNull();
      });
      expect(screen.getByTestId("analytics-preferences-general-settings-stub")).toBeTruthy();
    });

    it("persists both preferences off when confirming with initialTogglesOff without edits", async () => {
      const { store, user } = renderAnalyticsPreferencesSettings({
        params: { initialTogglesOff: true },
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: true,
          },
        }),
      });

      await user.press(screen.getByRole("button", { name: "Confirm" }));

      expect(store.getState().settings.analyticsEnabled).toBe(false);
      expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);

      expect(analytics.track).toHaveBeenCalledWith(
        "button_clicked",
        expect.objectContaining({
          appPerformance: false,
          personalizedExperience: false,
        }),
        true,
      );

      await waitFor(() => {
        expect(screen.queryByTestId("analytics-preferences-screen-title")).toBeNull();
      });
    });
  });
});
