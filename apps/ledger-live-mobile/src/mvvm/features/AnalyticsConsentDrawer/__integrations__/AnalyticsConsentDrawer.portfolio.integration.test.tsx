import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { renderWithReactQuery, screen, waitFor } from "@tests/test-renderer";
import { overrideInitialStateWithFeatureFlag } from "LLM/features/Portfolio/__integrations__/shared";
import { CURRENT_PRIVACY_POLICY_VERSION } from "@ledgerhq/live-common/privacyConsent";
import { AnalyticsConsentDrawer } from "../index";
import { withConsentDrawerState } from "../__tests__/helpers";
import { ScreenName } from "~/const";
import type { State } from "~/reducers/types";

const Stack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

function GeneralSettingsStub() {
  return <View testID="GeneralSettingsStub" />;
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name={ScreenName.GeneralSettings} component={GeneralSettingsStub} />
    </SettingsStack.Navigator>
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
  privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
});

/** Reconfirm: renewal first, analytics on → consentReconfirm. */
const overridePortfolioWithAnalyticsConsentReconfirm = composePortfolioOverrides({
  hasCompletedOnboarding: true,
  analyticsOptInEnabled: true,
  analyticsEnabled: true,
  personalizedRecommendationsEnabled: true,
  consentDate: null,
  privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
});

/** Privacy policy ack only (stale policy version, valid consent). */
const overridePortfolioWithPrivacySheet = composePortfolioOverrides({
  hasCompletedOnboarding: true,
  analyticsOptInEnabled: true,
  analyticsEnabled: true,
  personalizedRecommendationsEnabled: true,
  consentDate: new Date().toISOString(),
  privacyPolicyVersion: Math.max(0, CURRENT_PRIVACY_POLICY_VERSION - 1),
});

describe("AnalyticsConsentDrawer on Portfolio", () => {
  it("should show the analytics consent drawer when the user must see the fresh consent phase", async () => {
    renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
    });

    await screen.findByTestId("PortfolioEmptyList");

    expect(await screen.findByText("Help us improve Ledger")).toBeVisible();
  });

  it("should show the reconfirm copy when the user must see the consent reconfirm phase", async () => {
    renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithAnalyticsConsentReconfirm,
    });

    await screen.findByTestId("PortfolioEmptyList");

    expect(await screen.findByText("Continue improving Ledger?")).toBeVisible();
  });

  it("should opt in and close the drawer when the user taps Accept all on the fresh consent sheet", async () => {
    const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
    });

    await screen.findByTestId("PortfolioEmptyList");
    await screen.findByText("Help us improve Ledger");

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

  it("should keep analytics on when the user taps Yes, continue on reconfirm", async () => {
    const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithAnalyticsConsentReconfirm,
    });

    await screen.findByTestId("PortfolioEmptyList");
    await screen.findByText("Continue improving Ledger?");

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

  it("should show the privacy update sheet and close after Got it", async () => {
    const { user, store } = renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithPrivacySheet,
    });

    await screen.findByTestId("PortfolioEmptyList");
    await screen.findByText("We're updating our privacy policy");

    await user.press(screen.getByText("Got it"));

    await waitFor(() => {
      expect(screen.queryByText("We're updating our privacy policy")).toBeNull();
    });
    expect(store.getState().settings.analyticsConsentInfo.privacyPolicyVersion).toBe(
      CURRENT_PRIVACY_POLICY_VERSION,
    );
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
  });

  it("should close the drawer when the user taps Set preferences", async () => {
    const { user } = renderWithReactQuery(<IntegrationNavigator />, {
      overrideInitialState: overridePortfolioWithAnalyticsConsentDrawer,
    });

    await screen.findByTestId("PortfolioEmptyList");
    await screen.findByText("Help us improve Ledger");

    await user.press(screen.getByText("Set preferences"));

    await waitFor(() => {
      expect(screen.queryByText("Help us improve Ledger")).toBeNull();
    });
  });
});
