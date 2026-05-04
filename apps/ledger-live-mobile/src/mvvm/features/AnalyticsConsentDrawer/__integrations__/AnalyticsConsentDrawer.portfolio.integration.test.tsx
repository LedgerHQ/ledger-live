import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
import { overrideInitialStateWithFeatureFlag } from "LLM/features/Portfolio/__integrations__/shared";
import * as analytics from "~/analytics";
import { AnalyticsConsentDrawer } from "../index";
import { withConsentDrawerState } from "../__tests__/helpers";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import subDays from "date-fns/subDays";
import AnalyticsPreferencesSettings from "~/screens/Settings/AnalyticsPreferencesSettings";

const consentIsoOlderThanValidityWindow = () => subDays(new Date(), 366).toISOString();

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function GeneralSettingsStub() {
  return <View testID="GeneralSettingsStub" />;
}

function SettingsNavigator() {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 375, height: 812 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
        <SettingsStack.Screen name={ScreenName.GeneralSettings} component={GeneralSettingsStub} />
        <SettingsStack.Screen
          name={ScreenName.AnalyticsPreferencesSettings}
          component={AnalyticsPreferencesSettings}
        />
      </SettingsStack.Navigator>
    </SafeAreaProvider>
  );
}

/**
 * Minimal Portfolio-shaped screen: same mount order as Portfolio (list stub + consent drawer)
 * without pulling Swap / QuickActions, to avoid async teardown noise while still using a focused route.
 */
function PortfolioScreenWithConsentDrawer() {
  return (
    <View style={{ flex: 1 }}>
      <View testID="PortfolioEmptyList" />
      <AnalyticsConsentDrawer />
    </View>
  );
}

function IntegrationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithConsentDrawer} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
    </Stack.Navigator>
  );
}

const composePortfolioOverrides =
  (extra: Parameters<typeof withConsentDrawerState>[0]) => (state: State) =>
    withConsentDrawerState(extra)(overrideInitialStateWithFeatureFlag(state));

/** Fresh: renewal first, analytics off → consentFresh. */
const overridePortfolioWithAnalyticsConsentDrawer = composePortfolioOverrides({
  hasCompletedOnboarding: true,
  analyticsOptInEnabled: true,
  analyticsEnabled: false,
  personalizedRecommendationsEnabled: false,
  consentDate: null,
  privacyPolicyVersion: 1,
});

/** Reconfirm: renewal first, analytics on → consentReconfirm. */
const overridePortfolioWithAnalyticsConsentReconfirm = composePortfolioOverrides({
  hasCompletedOnboarding: true,
  analyticsOptInEnabled: true,
  analyticsEnabled: true,
  personalizedRecommendationsEnabled: true,
  consentDate: null,
  privacyPolicyVersion: 1,
});

/** Privacy policy ack only (stale policy version, valid consent). */
const overridePortfolioWithPrivacySheet = composePortfolioOverrides({
  hasCompletedOnboarding: true,
  analyticsOptInEnabled: true,
  analyticsEnabled: true,
  personalizedRecommendationsEnabled: true,
  consentDate: new Date().toISOString(),
  privacyPolicyVersion: 0,
});

describe("AnalyticsConsentDrawer on Portfolio", () => {
  describe("needs fresh consent", () => {
    it("should opt in and close the drawer when the user taps Accept all on the fresh consent sheet", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
      });

      await screen.findByTestId("PortfolioEmptyList");
      expect(await screen.findByText("Help us improve Ledger")).toBeVisible();

      await user.press(screen.getByText("Accept all"));

      await waitFor(() => {
        expect(screen.queryByText("Help us improve Ledger")).toBeNull();
      });
      expect(store.getState().settings.analyticsEnabled).toBe(true);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    });

    it("should opt out and close the drawer when the user taps Refuse all on the fresh consent sheet", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
      });

      await screen.findByTestId("PortfolioEmptyList");
      await screen.findByText("Help us improve Ledger");

      await user.press(screen.getByText("Refuse all"));

      await waitFor(() => {
        expect(screen.queryByText("Help us improve Ledger")).toBeNull();
      });
      expect(store.getState().settings.analyticsEnabled).toBe(false);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    });

    it("should close the drawer and open analytics preferences when the user taps Set preferences", async () => {
      const { user } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
      });

      await screen.findByTestId("PortfolioEmptyList");
      await screen.findByText("Help us improve Ledger");

      await user.press(screen.getByText("Set preferences"));

      await waitFor(() => {
        expect(screen.queryByText("Help us improve Ledger")).toBeNull();
      });
      expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();
    });

    it("should return to Portfolio after Set preferences and Confirm with toggles left off", async () => {
      const updateIdentifySpy = jest.spyOn(analytics, "updateIdentify").mockResolvedValue(undefined);
      try {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
        });

        await screen.findByTestId("PortfolioEmptyList");
        await screen.findByText("Help us improve Ledger");

        await user.press(screen.getByText("Set preferences"));

        expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();

        await user.press(screen.getByRole("button", { name: "Confirm" }));

        await waitFor(() => {
          expect(screen.queryByTestId("analytics-preferences-screen-title")).toBeNull();
        });
        expect(await screen.findByTestId("PortfolioEmptyList")).toBeVisible();

        expect(store.getState().settings.analyticsEnabled).toBe(false);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      } finally {
        updateIdentifySpy.mockRestore();
      }
    });
  });

  describe("needs reconfirmation", () => {
    it("should keep analytics on when the user taps Yes, continue on reconfirm", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithAnalyticsConsentReconfirm,
      });

      await screen.findByTestId("PortfolioEmptyList");
      expect(await screen.findByText("Continue improving Ledger?")).toBeVisible();

      await user.press(screen.getByText("Yes, continue"));

      await waitFor(() => {
        expect(screen.queryByText("Continue improving Ledger?")).toBeNull();
      });
      expect(store.getState().settings.analyticsEnabled).toBe(true);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    });

    it("should opt out when the user taps No, stop on reconfirm", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithAnalyticsConsentReconfirm,
      });

      await screen.findByTestId("PortfolioEmptyList");
      await screen.findByText("Continue improving Ledger?");

      await user.press(screen.getByText("No, stop"));

      await waitFor(() => {
        expect(screen.queryByText("Continue improving Ledger?")).toBeNull();
      });
      expect(store.getState().settings.analyticsEnabled).toBe(false);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    });
  });

  describe("needs privacy policy version update", () => {
    it("should show the privacy update sheet, persist the policy version, and close after Got it", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: overridePortfolioWithPrivacySheet,
      });

      await screen.findByTestId("PortfolioEmptyList");
      await screen.findByText("We're updating our privacy policy");

      await user.press(screen.getByText("Got it"));

      await waitFor(() => {
        expect(screen.queryByText("We're updating our privacy policy")).toBeNull();
      });
      expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    });
  });

  describe("when time-based renewal applies", () => {
    it("should show reconfirm when consent is older than one year and analytics are on", async () => {
      renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: composePortfolioOverrides({
          hasCompletedOnboarding: true,
          analyticsOptInEnabled: true,
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          consentDate: consentIsoOlderThanValidityWindow(),
          privacyPolicyVersion: 1,
        }),
      });

      await screen.findByTestId("PortfolioEmptyList");
      expect(await screen.findByText("Continue improving Ledger?")).toBeVisible();
    });

    it("should show fresh consent when consent is older than one year and analytics are off", async () => {
      renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: composePortfolioOverrides({
          hasCompletedOnboarding: true,
          analyticsOptInEnabled: true,
          analyticsEnabled: false,
          personalizedRecommendationsEnabled: false,
          consentDate: consentIsoOlderThanValidityWindow(),
          privacyPolicyVersion: 1,
        }),
      });

      await screen.findByTestId("PortfolioEmptyList");
      expect(await screen.findByText("Help us improve Ledger")).toBeVisible();
    });
  });
});
