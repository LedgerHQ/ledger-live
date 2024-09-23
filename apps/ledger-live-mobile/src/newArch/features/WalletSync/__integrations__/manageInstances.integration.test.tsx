import React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { WalletSyncSettingsNavigator } from "./shared";
import { State } from "~/reducers/types";
import { TrustchainMember } from "@ledgerhq/trustchain/types";

const INSTANCES: Array<TrustchainMember> = [
  {
    id: "currentInstance",
    name: "macOS",
    permissions: 112,
  },
  {
    id: "2",
    name: "Ipone 15",
    permissions: 112,
  },
];

const trustchain = {
  rootId: "rootId",
  applicationPath: "applicationPath",
  walletSyncEncryptionKey: "walletSyncEncryptionKey",
};

jest.mock("../hooks/useGetMembers", () => ({
  useGetMembers: () => ({
    isLoading: false,
    data: INSTANCES,
    isError: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

describe("ManageInstances", () => {
  it("Should open ManageInstances flow", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
        },
        trustchain: {
          ...state.trustchain,
          trustchain,
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

    //Manage Instances Flow
    expect(await screen.findByText(/2 Ledger Live apps synched/i)).toBeVisible();

    await user.press(await screen.findByText(/Manage/i));

    expect(await screen.findByText(/Ledger Live is synched across/i)).toBeVisible();

    expect(await screen.findByText(INSTANCES[0].name)).toBeVisible();
    expect(await screen.findByText(INSTANCES[1].name)).toBeVisible();
  });

  it("Should open ManageInstances flow and display Auto remove blocker", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
        },
        trustchain: {
          ...state.trustchain,
          trustchain,
          memberCredentials: {
            privatekey: "privatekey",
            pubkey: "currentInstance",
          },
        },
      }),
    });

    // Check if the ledger sync row is visible
    await expect(await screen.findByText(/ledger sync/i)).toBeVisible();

    // On Press the ledger sync row
    await user.press(await screen.findByText(/ledger sync/i));

    //Manage Instances Flow
    expect(await screen.findByText(/2 Ledger Live apps synched/i)).toBeVisible();

    await user.press(await screen.findByText(/Manage/i));

    expect(await screen.findByText(/Ledger Live is synched across/i)).toBeVisible();

    expect(await screen.findByText(INSTANCES[0].name)).toBeVisible();
    expect(await screen.findByText(INSTANCES[1].name)).toBeVisible();

    const instance = screen.getByTestId("walletSync-manage-instance-currentInstance");
    expect(instance).toBeDefined();

    await user.press(screen.getAllByText("Remove")[0]);

    // Auto remove check handled
    expect(screen.getByText(/You can’t remove this phone while you’re using it/i)).toBeDefined();

    await user.press(await screen.findByText(/I understand/i));

    const myInstance = screen.getByTestId("walletSync-manage-instance-2");
    expect(myInstance).toBeDefined();
  });
  it("Should redirect to the Manage Key screen", async () => {
    const { user } = render(<WalletSyncSettingsNavigator />, {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          readOnlyModeEnabled: false,
          overriddenFeatureFlags: { llmWalletSync: { enabled: true } },
        },
        trustchain: {
          ...state.trustchain,
          trustchain,
          memberCredentials: {
            privatekey: "privatekey",
            pubkey: "currentInstance",
          },
        },
      }),
    });

    await user.press(await screen.findByText(/ledger sync/i));
    await user.press(await screen.findByText(/Manage/i));
    await user.press(screen.getAllByText("Remove")[0]);
    expect(screen.getByText(/You can’t remove this phone while you’re using it/i)).toBeDefined();
    await user.press(await screen.getByTestId("ctaSecondary-detailled-error"));
    await waitFor(() => screen.findByText(/Sure you want delete sync?/i));
  });
});
