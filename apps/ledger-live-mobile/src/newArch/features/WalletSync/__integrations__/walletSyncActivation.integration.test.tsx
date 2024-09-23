import React from "react";
import { screen } from "@testing-library/react-native";
import { render, waitFor } from "@tests/test-renderer";
import { INITIAL_TEST, WalletSyncSharedNavigator } from "./shared";
import { DeviceLike, State } from "~/reducers/types";
import { setEnv } from "@ledgerhq/live-env";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceModelInfo } from "@ledgerhq/types-live";

const LAST_SEEN_DEVICE = {
  modelId: DeviceModelId.stax,
} as DeviceModelInfo;

const DEVICE = {
  id: "1",
  name: "STAX A",
  modelId: DeviceModelId.stax,
} as DeviceLike;

describe("WalletSyncActivation", () => {
  it("Should open WalletSyncActivation Flow and go through device selection", async () => {
    setEnv("MOCK", "1");

    const { user } = render(<WalletSyncSharedNavigator />, {
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
          lastSeenDevice: LAST_SEEN_DEVICE,
        },
        ble: {
          ...state.ble,
          knownDevices: [DEVICE],
        },
      }),
    });

    // Check if the activation screen is visible
    expect(await screen.findByText(/Turn on Ledger Sync for this phone?/i)).toBeVisible();

    // On Press Sync Accounts
    await user.press(
      await screen.findByRole("button", {
        name: "Turn on Ledger Sync",
      }),
    );

    await user.press(screen.getByText(/use your ledger/i));

    expect(await screen.findByText(/Choose your Ledger device/i)).toBeVisible();

    await user.press(
      await screen.findByRole("button", {
        name: "STAX A",
      }),
    );

    await waitFor(async () => {
      expect(await screen.getByTestId("device-action-loading")).toBeVisible();
    });

    // await waitFor(async () => {
    //   expect(await screen.findByText(`Continue on your Ledger Stax`)).toBeVisible();
    // });
  });

  it("Should open WalletSyncActivation Flow with learn More link", async () => {
    render(<WalletSyncSharedNavigator />, {
      overrideInitialState: INITIAL_TEST,
    });

    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    expect(await screen.findByText(/How does Ledger Sync work?/i)).toBeVisible();
  });

  it("Should open WalletSyncActivation Flow without learn More link", async () => {
    render(<WalletSyncSharedNavigator />, {
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

    expect(await screen.findByText(/Turn on Ledger Sync for this phone/i)).toBeVisible();
    expect(screen.queryByText(/How does Ledger Sync work?/i)).toBeUndefined;
  });
});
