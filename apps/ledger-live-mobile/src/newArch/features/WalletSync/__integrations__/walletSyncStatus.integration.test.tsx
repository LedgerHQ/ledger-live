import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";

jest.mock("../hooks/useLedgerSyncStatus", () => ({
  useLedgerSyncStatus: () => ({
    error: new Error(),
    isError: true,
  }),
}));

describe("WalletSyncStatus", () => {
  it("Should display warning banner when LedgerSync is down", async () => {
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
                watchConfig: {
                  pollingInterval: 10000,
                  initialTimeout: 5000,
                  userIntentDebounce: 1000,
                },
              },
            },
          },
        },
        trustchain: {
          ...state.trustchain,
          trustchain: {
            rootId: "rootId",
            applicationPath: "applicationPath",
            walletSyncEncryptionKey: "walletSyncEncryptionKey",
          },
        },
      }),
    });

    // Check if the ledger sync row is visible
    await expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    // Check if the activation screen is visible
    expect(await screen.findByText(/Ledger Sync is currently unavailable./i)).toBeVisible();
  });
});
