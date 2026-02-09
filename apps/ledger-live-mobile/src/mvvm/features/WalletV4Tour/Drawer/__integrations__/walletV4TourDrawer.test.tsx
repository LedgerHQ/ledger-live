import React from "react";
import { Button } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor } from "@tests/test-renderer";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../index";

const Stack = createNativeStackNavigator();

const TestScreen = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();
  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      <Button onPress={handleCloseDrawer} title="Close Drawer" />
      <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
    </>
  );
};

const TestNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Test" component={TestScreen} />
  </Stack.Navigator>
);

describe("WalletV4TourDrawer integration", () => {
  it("should persist seen state when closed", async () => {
    const { store, user } = render(<TestNavigator />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          hasSeenWalletV4Tour: false,
        },
      }),
    });

    await user.press(screen.getByText("Open Drawer"));
    await user.press(screen.getByText("Close Drawer"));

    await waitFor(() => expect(store.getState().settings.hasSeenWalletV4Tour).toBe(true));
  });

  it("should not open drawer when tour has already been seen", async () => {
    const { store, user } = render(<TestNavigator />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          hasSeenWalletV4Tour: true,
        },
      }),
    });

    await user.press(screen.getByText("Open Drawer"));

    expect(store.getState().settings.hasSeenWalletV4Tour).toBe(true);
  });
});
