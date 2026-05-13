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
import AnalyticsPreferencesSettings from "~/screens/Settings/AnalyticsPreferencesSettings";

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function SettingsNavigator() {
  function GeneralSettingsStub() {
    return <View />;
  }
  return (
    <SafeAreaProvider>
      <SettingsStack.Navigator>
        <SettingsStack.Screen name={ScreenName.GeneralSettings} component={GeneralSettingsStub} />
        <SettingsStack.Screen
          name={ScreenName.AnalyticsPreferencesSettings}
          component={AnalyticsPreferencesSettings}
        />
      </SettingsStack.Navigator>
    </SafeAreaProvider>
  );
}

function IntegrationNavigator() {
  /**
   * Minimal Portfolio-shaped screen: same mount order as Portfolio (list stub + consent drawer)
   * without pulling Swap / QuickActions, to avoid async teardown noise while still using a focused route.
   */
  function PortfolioScreenWithConsentDrawer() {
    return (
      <View>
        <View />
        <AnalyticsConsentDrawer />
      </View>
    );
  }

  const PortfolioName = "Portfolio";

  return (
    <Stack.Navigator initialRouteName={PortfolioName}>
      <Stack.Screen name={PortfolioName} component={PortfolioScreenWithConsentDrawer} />
      <Stack.Screen name="Settings" component={SettingsNavigator} />
    </Stack.Navigator>
  );
}

const composePortfolioOverrides =
  (extra: Parameters<typeof withConsentDrawerState>[0]) => (state: State) =>
    withConsentDrawerState(extra)(overrideInitialStateWithFeatureFlag(state));

const ANALYTICS_CONSENT_DRAWER_PAGE = "Analytics consent drawer";
const FRESH_CONSENT_TITLE = "Help us improve Ledger";
const RECONFIRM_TITLE = "Continue improving Ledger?";
const PRIVACY_UPDATE_TITLE = "We're updating our privacy policy";

describe("AnalyticsConsentDrawer on Portfolio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("needs fresh consent", () => {
    describe("when analytics and recommendations are disabled", () => {
      it("should opt in when the user accepts", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Accept all" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(true);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Refuse all" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(false);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("link", { name: "Set preferences" }));
        expect(analytics.track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DRAWER_PAGE,
        });

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();
      });
    });

    describe("when analytics is disabled and recommendations are enabled", () => {
      it("should opt in when the user accepts", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Accept all" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(true);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Refuse all" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(false);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: false,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(FRESH_CONSENT_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentFresh",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("link", { name: "Set preferences" }));
        expect(analytics.track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DRAWER_PAGE,
        });

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();
      });
    });
  });

  describe("needs reconfirmation", () => {
    describe("when analytics is enabled and recommendations are disabled", () => {
      it("should keep analytics enabled when the user accepts", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Yes, continue" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(true);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "No, stop" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(false);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: false,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("link", { name: "Set preferences" }));
        expect(analytics.track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DRAWER_PAGE,
        });

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();
      });
    });

    describe("when analytics and recommendations are enabled", () => {
      it("should keep analytics enabled when the user accepts", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "Yes, continue" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_in",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(true);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(true);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should opt out when the user refuses", async () => {
        const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("button", { name: "No, stop" }));
        expect(analytics.track).toHaveBeenCalledWith(
          "button_clicked",
          {
            button: "analytics_consent_opt_out",
            page: ANALYTICS_CONSENT_DRAWER_PAGE,
            privacyPolicyVersion: 1,
          },
          true,
        );

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(store.getState().settings.analyticsEnabled).toBe(false);
        expect(store.getState().settings.personalizedRecommendationsEnabled).toBe(false);
        expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
        expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
      });

      it("should open preferences when the user chooses Set preferences", async () => {
        const { user } = renderWithReactQuery(<IntegrationNavigator />, {
          overrideInitialState: composePortfolioOverrides({
            hasCompletedOnboarding: true,
            analyticsOptInEnabled: true,
            analyticsEnabled: true,
            personalizedRecommendationsEnabled: true,
            consentDate: null,
            privacyPolicyVersion: 1,
          }),
        });

        const drawerTitle = await screen.findByText(RECONFIRM_TITLE);
        expect(drawerTitle).toBeVisible();
        expect(analytics.screen).toHaveBeenCalledWith(
          "AnalyticsConsentDrawer",
          "Analytics consent",
          expect.objectContaining({
            phase: "consentReconfirm",
            type: "drawer",
          }),
          true,
          false,
          false,
          true,
        );

        await user.press(screen.getByRole("link", { name: "Set preferences" }));
        expect(analytics.track).toHaveBeenCalledWith("button_clicked", {
          button: "analytics_consent_set_preferences",
          page: ANALYTICS_CONSENT_DRAWER_PAGE,
        });

        await waitFor(() => {
          expect(drawerTitle).not.toBeOnTheScreen();
        });
        expect(await screen.findByTestId("analytics-preferences-screen-title")).toBeVisible();
      });
    });
  });

  describe("needs privacy policy version update", () => {
    it("should show the privacy update sheet, persist the policy version, and close after Got it", async () => {
      const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
        overrideInitialState: composePortfolioOverrides({
          hasCompletedOnboarding: true,
          analyticsOptInEnabled: true,
          analyticsEnabled: true,
          personalizedRecommendationsEnabled: true,
          consentDate: new Date().toISOString(),
          privacyPolicyVersion: 0,
        }),
      });

      const privacySheetTitle = await screen.findByText(PRIVACY_UPDATE_TITLE);
      expect(privacySheetTitle).toBeVisible();
      expect(analytics.screen).toHaveBeenCalledWith(
        "AnalyticsConsentDrawer",
        "Analytics consent",
        expect.objectContaining({
          phase: "privacy",
          type: "drawer",
        }),
        true,
        false,
        false,
        true,
      );

      await user.press(screen.getByRole("button", { name: "Got it" }));
      expect(analytics.track).toHaveBeenCalledWith(
        "button_clicked",
        {
          button: "analytics_consent_privacy_got_it",
          page: ANALYTICS_CONSENT_DRAWER_PAGE,
          privacyPolicyVersion: 1,
        },
        true,
      );

      await waitFor(() => {
        expect(privacySheetTitle).not.toBeOnTheScreen();
      });
      expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(1);
      expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
      expect(analytics.updateIdentify).toHaveBeenCalledTimes(1);
    });
  });
});
