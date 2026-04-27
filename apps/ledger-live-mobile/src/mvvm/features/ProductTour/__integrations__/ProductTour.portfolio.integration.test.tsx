import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, render, screen, withFlagOverrides } from "@tests/test-renderer";
import { tickProductTourDeeplink } from "~/actions/appstate";
import { productTourDeeplinkNonceSelector } from "~/reducers/appstate";
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
  it("should mount the Product Tour subtree when lwmProductTour is on and onboarding is complete", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("product-tour-integration-portfolio")).toBeVisible();
    expect(screen.getByTestId("product-tour-portfolio-mount")).toBeVisible();
  });

  it("should not mount the Product Tour subtree when lwmProductTour is off", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: false } },
        withOnboarding(true),
      ),
    });

    expect(await screen.findByTestId("product-tour-integration-portfolio")).toBeVisible();
    expect(screen.queryByTestId("product-tour-portfolio-mount")).toBeNull();
  });

  it("should not mount the Product Tour subtree when onboarding is not complete", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: withFlagOverrides(
        { lwmProductTour: { enabled: true } },
        withOnboarding(false),
      ),
    });

    expect(await screen.findByTestId("product-tour-integration-portfolio")).toBeVisible();
    expect(screen.queryByTestId("product-tour-portfolio-mount")).toBeNull();
  });

  it("should increment productTourDeeplinkNonce when tick dispatches while the subtree is mounted", async () => {
    const { store } = render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    await screen.findByTestId("product-tour-portfolio-mount");

    act(() => {
      store.dispatch(tickProductTourDeeplink());
    });

    expect(productTourDeeplinkNonceSelector(store.getState())).toBe(1);
    expect(screen.getByTestId("product-tour-portfolio-mount")).toBeVisible();
  });
});
