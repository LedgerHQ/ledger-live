import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { renderWithReactQuery, screen } from "@tests/test-renderer";
import { overrideInitialStateWithFeatureFlag } from "LLM/features/Portfolio/__integrations__/shared";
import { CURRENT_PRIVACY_POLICY_VERSION } from "~/analytics/privacyConsent";
import { AnalyticsConsentDrawer } from "../index";
import { withConsentDrawerState } from "../__tests__/helpers";
import type { State } from "~/reducers/types";

const Stack = createNativeStackNavigator();

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
    </Stack.Navigator>
  );
}

/** Fresh: renewal first, analytics off → consentFresh. */
const overridePortfolioWithAnalyticsConsentDrawer = (state: State): State =>
  withConsentDrawerState({
    hasCompletedOnboarding: true,
    analyticsOptInEnabled: true,
    analyticsEnabled: false,
    personalizedRecommendationsEnabled: false,
    consentDate: null,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
  })(overrideInitialStateWithFeatureFlag(state));

/** Reconfirm: renewal first, analytics on → consentReconfirm. */
const overridePortfolioWithAnalyticsConsentReconfirm = (state: State): State =>
  withConsentDrawerState({
    hasCompletedOnboarding: true,
    analyticsOptInEnabled: true,
    analyticsEnabled: true,
    personalizedRecommendationsEnabled: true,
    consentDate: null,
    privacyPolicyVersion: CURRENT_PRIVACY_POLICY_VERSION,
  })(overrideInitialStateWithFeatureFlag(state));

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
});
