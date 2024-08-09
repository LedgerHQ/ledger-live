import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";

describe("WalletSyncSettings", () => {
  it("Should open wallet sync activation flow page from settings", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: {
            llmWalletSync: {
              enabled: true,
              params: {
                environment: "STAGING",
                watchConfig: {},
              },
            },
          },
        },
      }),
    });

    // Check if the ledger sync row is visible
    await expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    // Check if the activation screen is visible
    await expect(await screen.findByText(/sync your accounts across all platforms/i)).toBeVisible();
    await expect(await screen.findByText(/already created a key?/i)).toBeVisible();

    // On Press the already created a key link
    await user.press(await screen.findByText(/already created a key?/i));

    // Check if the drawer is visible
    await expect(await screen.findByText(/Choose your sync method/i)).toBeVisible();
  });
});
