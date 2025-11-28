import React from "react";
import { render, act, fireEvent, screen } from "@tests/test-renderer";
import { TestButtonPage } from "./shared";
import { State } from "~/reducers/types";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ModularDrawerLocation } from "../../ModularDrawer";

describe("AddAccount", () => {
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
    expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    expect(await screen.findByText(/add another account/i));
    expect(await screen.findByText(/Use your Ledger device/i));
    await act(async () => {
      fireEvent.press(await screen.findByText(/Use Ledger Sync/i));
    });
    expect(await screen.findByText(/choose your sync method/i)).toBeVisible();
    expect(await screen.findByText(/Scan QR code/i));
  });

  /**====== use ModularDrawer Test =======*/
  it("Should open ModularDrawer when selecting use Ledger device", async () => {
    const { user } = render(<TestButtonPage />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: {
            llmWalletSync: { enabled: false },
            llmModularDrawer: {
              enabled: true,
              params: {
                [ModularDrawerLocation.ADD_ACCOUNT]: true,
              },
            },
          },
        },
        modularDrawer: {
          ...state.modularDrawer,
          isOpen: false,
          preselectedCurrencies: [mockEthCryptoCurrency.id, mockBtcCryptoCurrency.id],
        },
      }),
    });

    const addAssetButton = await screen.findByText(/add asset/i);
    // Check if the add asset button is visible
    expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    expect(await screen.findByText(/add another account/i));
    expect(await screen.findByText(/Use your Ledger device/i));

    // Press the "Use your Ledger device" button to trigger ModularDrawer
    await user.press(screen.getByText(/Use your Ledger device/i));
    expect(screen.getByText(/Bitcoin/i)).toBeVisible();
  });
});
