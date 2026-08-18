import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { act, render, screen, waitFor, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { handleProductTourDeeplink } from "~/navigation/deeplinks/handleProductTourDeeplink";
import { ProductTourPortfolioMount } from "../index";

const Stack = createNativeStackNavigator();

const eligiblePortfolioState = withFlagOverrides(
  { lwmProductTour: { enabled: true } },
  (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      productTourCompleted: false,
    },
  }),
);

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
  it("should not auto-open the drawer when eligible on Portfolio mount", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("product-tour-portfolio-mount")).toBeVisible();
    expect(screen.queryByTestId("product-tour-slides-container")).toBeNull();
  });

  it("should open when ledgerlive://product-tour is handled while eligible", async () => {
    const { store } = render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("product-tour-portfolio-mount")).toBeVisible();

    await act(async () => {
      handleProductTourDeeplink({
        isLwmProductTourEnabled: true,
        hasCompletedOnboarding: true,
        dispatch: store.dispatch,
        config: { screens: {} } as Parameters<typeof handleProductTourDeeplink>[0]["config"],
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("product-tour-slides-container")).toBeVisible();
    });
  });

  it.each([
    {
      name: "lwmProductTour is disabled",
      flagEnabled: false,
      productTourCompleted: false,
      isLwmProductTourEnabled: false,
    },
    {
      name: "the tour is completed",
      flagEnabled: true,
      productTourCompleted: true,
      isLwmProductTourEnabled: true,
    },
  ])(
    "should not open when ledgerlive://product-tour is handled and $name",
    async ({ flagEnabled, productTourCompleted, isLwmProductTourEnabled }) => {
      const { store } = render(<IntegrationNavigator />, {
        overrideInitialState: withFlagOverrides(
          { lwmProductTour: { enabled: flagEnabled } },
          (state: State) => ({
            ...state,
            settings: {
              ...state.settings,
              hasCompletedOnboarding: true,
              productTourCompleted,
            },
          }),
        ),
      });

      expect(screen.queryByTestId("product-tour-portfolio-mount")).toBeNull();

      await act(async () => {
        handleProductTourDeeplink({
          isLwmProductTourEnabled,
          hasCompletedOnboarding: true,
          dispatch: store.dispatch,
          config: { screens: {} } as Parameters<typeof handleProductTourDeeplink>[0]["config"],
        });
      });

      expect(screen.queryByTestId("product-tour-slides-container")).toBeNull();
    },
  );
});
