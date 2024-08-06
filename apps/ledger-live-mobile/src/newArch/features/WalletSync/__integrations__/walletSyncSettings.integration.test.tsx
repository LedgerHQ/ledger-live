import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";

describe("WalletSyncSettings", () => {
  const initialState = (state: State) => ({
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
  });

  it("Should display the ledger sync row", async () => {
    render(<WalletSyncSettingsNavigator />, { overrideInitialState: initialState });
    await expect(await screen.findByText(/ledger sync/i)).toBeVisible();
  });

  it("Should open the activation drawer when ledger sync row is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: initialState,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await expect(await screen.findByText(/sync your accounts across all platforms/i)).toBeVisible();
    await expect(await screen.findByText(/already created a key?/i)).toBeVisible();
  });

  it("Should open the drawer when 'already created a key' button is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: initialState,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/already created a key?/i));
    await expect(await screen.findByText(/choose your sync method/i)).toBeVisible();
  });

  it("Should open the QR code scene when 'scan a qr code' toggle is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: initialState,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/already created a key?/i));
    await user.press(await screen.findByText(/scan a qr code/i));
    await expect(screen.queryAllByText(/scan qr code/i)).toHaveLength(2);
    await expect(screen.getByTestId("scan-ws-camera")).toBeVisible();
  });

  it("Should display the QR code when 'show qr' toggle is pressed", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: initialState,
    });
    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/already created a key?/i));
    await user.press(await screen.findByText(/scan a qr code/i));
    await user.press(await screen.queryAllByText(/show qr/i)[0]);
    await expect(await screen.getByTestId("ws-show-qr-code")).toBeVisible();
  });
});
