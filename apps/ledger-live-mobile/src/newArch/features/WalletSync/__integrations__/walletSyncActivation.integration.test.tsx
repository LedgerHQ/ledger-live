import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSharedNavigator } from "./shared";
import { State } from "~/reducers/types";

describe("WalletSyncActivation", () => {
  it("Should WalletSyncActivation Flow and go through device selection", async () => {
    const { user } = render(<WalletSyncSharedNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
        },
      }),
    });

    // Check if the activation screen is visible
    expect(await screen.findByText(/sync your accounts across all platforms/i)).toBeVisible();

    // On Press Sync Accounts
    await user.press(
      await screen.findByRole("button", {
        name: "Sync your accounts",
      }),
    );

    expect(
      await screen.findByText(/Choose the Ledger device you will use to secure your backup/i),
    ).toBeVisible();
  });
});
