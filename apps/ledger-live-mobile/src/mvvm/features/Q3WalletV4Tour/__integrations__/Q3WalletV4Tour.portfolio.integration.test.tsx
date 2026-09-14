import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useQ3WalletV4TourDrawer, Q3WalletV4TourDrawer } from "../Drawer";

const Stack = createNativeStackNavigator();

const eligiblePortfolioState = withFlagOverrides(
  { releaseTour: { enabled: true, params: { variant: "q3_a" } } },
  (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      hasCompletedOnboarding: true,
      hasSeenQ3WalletV4Tour: false,
    },
  }),
);

function PortfolioScreenWithQ3Tour() {
  const { isDrawerOpen, handleCloseDrawer, closeDrawer, onSlideChange } = useQ3WalletV4TourDrawer();

  return (
    <View style={{ flex: 1 }} testID="q3-wallet-v4-tour-integration-portfolio">
      <Q3WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
      />
    </View>
  );
}

function IntegrationNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Portfolio">
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithQ3Tour} />
    </Stack.Navigator>
  );
}

describe("Q3WalletV4Tour on Portfolio (integration)", () => {
  it("should open the first slide when eligible on portfolio", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("q3-wallet-v4-tour-integration-portfolio")).toBeVisible();

    const slidesContainer = await screen.findByTestId("q3-wallet-v4-tour-slides-container");
    fireEvent(slidesContainer, "layout", {
      nativeEvent: { layout: { width: 375, height: 800 } },
    });

    expect(await screen.findByText("A quick tour of the latest")).toBeVisible();
  });
});
