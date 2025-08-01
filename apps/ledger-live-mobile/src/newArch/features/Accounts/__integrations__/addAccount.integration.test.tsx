import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { TestButtonPage } from "./shared";
import { State } from "~/reducers/types";
import { useGroupedCurrenciesByProvider } from "@ledgerhq/live-common/modularDrawer/__mocks__/useGroupedCurrenciesByProvider.mock";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { ModularDrawerLocation } from "../../ModularDrawer";

jest.mock("@ledgerhq/live-common/deposit/useGroupedCurrenciesByProvider.hook", () => ({
  useGroupedCurrenciesByProvider: () => useGroupedCurrenciesByProvider(),
}));

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
    expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    expect(await screen.findByText(/add another account/i));
    expect(await screen.findByText(/Use your Ledger device/i));
    expect(await screen.findByText(/Use Ledger Sync/i));
    // On press add with ledger device
    await user.press(screen.getByText(/Use your Ledger device/i));
    expect(await screen.findByText(/Select Asset/i)).toBeVisible();
    // On click back
    await user.press(await screen.findByTestId(/navigation-header-back-button/i));
    expect(addAssetButton).toBeVisible();
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
    expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    expect(await screen.findByText(/add another account/i));
    expect(await screen.findByText(/Use your Ledger device/i));
    expect(await screen.findByText(/Use Ledger Sync/i));
    // On press add with wallet sync
    await user.press(screen.getByText(/Use Ledger Sync/i));
    expect(await screen.findByText(/choose your sync method/i)).toBeVisible();
    expect(await screen.findByText(/Scan QR code/i));
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
    expect(addAssetButton).toBeVisible();
    // Open drawer
    await user.press(addAssetButton);
    // Wait for the drawer to open
    expect(await screen.findByText(/add another account/i));
    expect(await screen.findByText(/Use your Ledger device/i));
    expect(await screen.findByText(/import from desktop/i));
    // On press add from desktop
    await user.press(screen.getByText(/import from desktop/i));
    expect(await screen.findByText(/Scan and import your accounts from Ledger Live desktop/i));
  });

  /**====== use ModularDrawer Test =======*/
  it.only("Should open ModularDrawer when selecting use Ledger device", async () => {
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
          isOpen: false,
          preselectedCurrencies: [mockEthCryptoCurrency, mockBtcCryptoCurrency],
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
    expect(await screen.findByText(/import from desktop/i));

    // Press the "Use your Ledger device" button to trigger ModularDrawer
    await user.press(screen.getByText(/Use your Ledger device/i));
    expect(await screen.findByText(/Bitcoin/i));
  });
});
