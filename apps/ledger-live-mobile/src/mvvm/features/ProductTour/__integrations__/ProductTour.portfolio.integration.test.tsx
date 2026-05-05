import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { ProductTourPortfolioMount } from "../index";

const Stack = createNativeStackNavigator();

const withOnboarding = (completed: boolean) => (state: State) => ({
  ...state,
  settings: { ...state.settings, hasCompletedOnboarding: completed },
});

const eligiblePortfolioState = withFlagOverrides(
  { lwmProductTour: { enabled: true } },
  withOnboarding(true),
);

/**
 * Portfolio-shaped screen: same mount point as real Portfolio (ProductTourPortfolioMount)
 * without pulling the full Portfolio tree.
 */
function PortfolioScreenWithProductTour() {
  return (
    <View style={{ flex: 1 }} testID="product-tour-integration-portfolio">
      <ProductTourPortfolioMount />
    </View>
  );
}

function IntegrationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithProductTour} />
    </Stack.Navigator>
  );
}

describe("ProductTour on Portfolio (integration)", () => {
  it("should mount the Product Tour subtree when eligible inside a native stack screen", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("product-tour-integration-portfolio")).toBeVisible();
    expect(screen.getByTestId("product-tour-portfolio-mount")).toBeVisible();
  });
});
