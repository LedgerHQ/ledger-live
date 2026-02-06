import React from "react";
import { Button } from "react-native";
import { render, screen, waitFor } from "@tests/test-renderer";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "../index";

const TestComponent = () => {
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer } = useWalletV4TourDrawer();
  return (
    <>
      <Button onPress={handleOpenDrawer} title="Open Drawer" />
      <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
    </>
  );
};

describe("WalletV4TourDrawer integration", () => {
  it("should persist seen state when closed", async () => {
    const { store, user } = render(<TestComponent />, {
      overrideInitialState: state => ({
        ...state,
        settings: {
          ...state.settings,
          hasSeenWalletV4Tour: false,
        },
      }),
    });

    await user.press(screen.getByText("Open Drawer"));

    const closeButton = await screen.findByTestId("drawer-close-button");
    await user.press(closeButton);

    await waitFor(() => expect(store.getState().settings.hasSeenWalletV4Tour).toBe(true));
  });
});
