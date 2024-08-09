import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";

jest.mock("../hooks/useDestroyTrustchain", () => ({
  useDestroyTrustchain: () => ({
    deleteMutation: {
      isPending: false,
      error: null,
      mutateAsync: jest.fn(),
    },
  }),
}));

describe("ManageKey", () => {
  it("Should open ManageKey flow and delete trustchain", async () => {
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
          memberCredentials: {
            privatekey: "privatekey",
            pubkey: "pubkey",
          },
        },
      }),
    });

    // Check if the ledger sync row is visible
    await expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    //Manage Key Flow
    expect(await screen.findByText(/Manage Key/i)).toBeVisible();

    await user.press(await screen.findByText(/Manage Key/i));

    expect(await screen.findByText(/Delete your key/i)).toBeVisible();

    await user.press(await screen.findByText(/Delete your key/i));

    expect(
      await screen.findByText(/Do you really want to delete your encryption key?/i),
    ).toBeVisible();

    await user.press(await screen.findByTestId("delete-trustchain"));

    expect(
      await screen.findByText(
        /Your devices have been unsynchronized and your key has been deleted/i,
      ),
    ).toBeVisible();
  });
});
