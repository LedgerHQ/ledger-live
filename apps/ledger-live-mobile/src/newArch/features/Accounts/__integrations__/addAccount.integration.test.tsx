import React from "react";
import { screen } from "@testing-library/react-native";
import { render, act } from "@tests/test-renderer";
import { TestButtonPage } from "./shared";
import { State } from "~/reducers/types";

describe("AddAccount", () => {
  it("Should open select add account method drawer with Wallet Sync option and navigate to import with your Ledger", async () => {
    const { user } = render(<TestButtonPage />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
        },
      }),
    });

    const addAssetButton = await screen.findByText(/Add asset/i);

    // Check if the add asset button is visible
    await expect(addAssetButton).toBeVisible();
    // Open drawer
    await act(async () => {
      await user.press(addAssetButton);
    });
    // Wait for the drawer to open
    await expect(await screen.findByText(/add another account/i));
    await expect(await screen.findByText(/add with your ledger/i));
    await expect(await screen.findByText(/import via another ledger live app/i));

    // On press add with another ledger live app
    await act(async () => {
      await user.press(await screen.getByText(/add with your ledger/i));
    });
    await expect(await screen.findByText(/crypto asset/i)).toBeVisible();

    // On click back
    await act(async () => {
      await user.press(await screen.findByTestId(/navigation-header-back-button/i));
    });
    await expect(addAssetButton).toBeVisible();
  });
});
