import React from "react";
import { screen } from "@testing-library/react-native";
import { render, withFlagOverrides } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import {
  mockKeyRingMemberKeyRecord,
  mockKeyRingTreeRecord,
} from "@domain/entity-key-ring/schema.mock";
import { mockKeyRingState } from "@domain/entity-key-ring/slice.mock";

describe("WalletSyncActivated", () => {
  it("Should open WalletSyncActivated screen", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: withFlagOverrides(
        {
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
        state => ({
          ...state,
          settings: {
            ...state.settings,
            readOnlyModeEnabled: false,
          },
          trustchain: mockKeyRingState({
            trustchain: mockKeyRingTreeRecord({
              rootId: "000c9ec1a1ab774f7eaeff2b0d4ad695f1fa07ea28d33f5d34126cb1152d6d83f6",
            }),
            // A member of the key tree the Ledger Sync handlers serve.
            memberCredentials: mockKeyRingMemberKeyRecord({
              pubkey: "03d682b0be923a68e2aa077c3b49c79be57d447d8dca615628f5adceb2ccd175be",
            }),
          }),
        }),
      ),
    });

    // Check if the ledger sync row is visible
    expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    // Check if the activated screen is visible

    expect(await screen.findByText(/Delete Sync/i)).toBeVisible();

    expect(await screen.findByText(/Manage/i)).toBeVisible();
  });
});
