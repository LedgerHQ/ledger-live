import React from "react";
import { screen } from "@testing-library/react-native";
import { render, act } from "@tests/test-renderer";
import { TestButtonPage } from "./shared";
import { State } from "~/reducers/types";

describe("AddAccount", () => {
  /**====== Import with ledger device test =======*/
  it("Should open select add account method drawer with WS feature flag and navigate to import with your Ledger", async () => {
    const { user } = render(<TestButtonPage />, {
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
                watchConfig: {
                  pollingInterval: 10000,
                  initialTimeout: 5000,
                  userIntentDebounce: 1000,
                },
              },
            },
          },
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
    await expect(await screen.findByText(/Use your Ledger device/i));
    await expect(await screen.findByText(/Use Ledger Sync/i));
    // On press add with another ledger live app
    await act(async () => {
      await user.press(await screen.getByText(/Use your Ledger device/i));
    });
    await expect(await screen.findByText(/crypto asset/i)).toBeVisible();
    // On click back
    await act(async () => {
      await user.press(await screen.findByTestId(/navigation-header-back-button/i));
    });
    await expect(addAssetButton).toBeVisible();
  });

  /**====== Import with WS test =======*/
  it("Should open select add account method drawer with WS feature flag and navigate to import with wallet sync", async () => {
    const { user } = render(<TestButtonPage />, {
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
                watchConfig: {
                  pollingInterval: 10000,
                  initialTimeout: 5000,
                  userIntentDebounce: 1000,
                },
              },
            },
          },
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
    await expect(await screen.findByText(/Use your Ledger device/i));
    await expect(await screen.findByText(/Use Ledger Sync/i));
    // On press add with wallet sync
    await act(async () => {
      await user.press(await screen.getByText(/Use Ledger Sync/i));
    });
    await expect(await screen.findByText(/choose your sync method/i)).toBeVisible();
    await expect(await screen.findByText(/Scan a QR code/i));
  });

  /**====== Import from desktop Test =======*/
  it("Should open select add account method drawer without WS feature flag and navigate to import from desktop", async () => {
    const { user } = render(<TestButtonPage />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: false } },
        },
      }),
    });

    const addAssetButton = await screen.findByText(/add asset/i);
    // Check if the add asset button is visible
    await expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    await expect(await screen.findByText(/add another account/i));
    await expect(await screen.findByText(/Use your Ledger device/i));
    await expect(await screen.findByText(/import from desktop/i));
    // On press add from desktop
    await user.press(await screen.getByText(/import from desktop/i));
    await expect(
      await screen.findByText(/Scan and import your accounts from Ledger Live desktop/i),
    );
  });
});
