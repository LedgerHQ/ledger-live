import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { fireEvent, render, screen, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { useQ2WalletV4TourDrawer, Q2WalletV4TourDrawer } from "../Drawer";

const Stack = createNativeStackNavigator();

const eligiblePortfolioState = withFlagOverrides(
  { lwmWallet40: { enabled: true, params: { q2Tour: true } } },
  (state: State) => ({
    ...state,
    settings: {
      ...state.settings,
      hasSeenQ2WalletV4Tour: false,
    },
  }),
);

function PortfolioScreenWithQ2Tour() {
  const { isDrawerOpen, handleCloseDrawer, closeDrawer, onSlideChange } = useQ2WalletV4TourDrawer();

  return (
    <View style={{ flex: 1 }} testID="q2-wallet-v4-tour-integration-portfolio">
      <Q2WalletV4TourDrawer
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
      <Stack.Screen name="Portfolio" component={PortfolioScreenWithQ2Tour} />
    </Stack.Navigator>
  );
}

describe("Q2WalletV4Tour on Portfolio (integration)", () => {
  it("should open the first slide when eligible on portfolio", async () => {
    render(<IntegrationNavigator />, {
      overrideInitialState: eligiblePortfolioState,
    });

    expect(await screen.findByTestId("q2-wallet-v4-tour-integration-portfolio")).toBeVisible();

    const slidesContainer = await screen.findByTestId("q2-wallet-v4-tour-slides-container");
    fireEvent(slidesContainer, "layout", {
      nativeEvent: { layout: { width: 375, height: 800 } },
    });

    expect(
      await screen.findByText("Smarter portfolio management. Clearer paths to growth"),
    ).toBeVisible();
  });
});
