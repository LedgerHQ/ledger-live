import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";
import { http, HttpResponse } from "msw";
import { server } from "@tests/server";
import { crypto } from "@ledgerhq/hw-ledger-key-ring-protocol";

jest.mock("../hooks/useLedgerSyncStatus", () => ({
  useLedgerSyncStatus: () => ({
    error: new Error(),
    isError: true,
  }),
}));

describe("WalletSyncStatus", () => {
  it("Should display warning banner when LedgerSync is down", async () => {
    const keypair = await crypto.randomKeypair();

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
            rootId: "000c9ec1a1ab774f7eaeff2b0d4ad695f1fa07ea28d33f5d34126cb1152d6d83f6",
            applicationPath: "m/0'/16'/0'",
            walletSyncEncryptionKey: crypto.to_hex(keypair.privateKey),
          },
          memberCredentials: {
            privatekey: crypto.to_hex(keypair.privateKey),
            pubkey: "03d682b0be923a68e2aa077c3b49c79be57d447d8dca615628f5adceb2ccd175be",
          },
        },
      }),
    });

    server.use(
      http.get("https://trustchain-backend.api.aws.stg.ldg-tech.com/v1/challenge", () => {
        return HttpResponse.error();
      }),
    );

    // Check if the ledger sync row is visible
    expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    // Check if the activation screen is visible
    expect(await screen.findByText(/Ledger Sync is temporarily unavailable/i)).toBeVisible();
  });
});
