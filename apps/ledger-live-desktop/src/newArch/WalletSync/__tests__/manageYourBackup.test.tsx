/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { Flow, Step, initialStateWalletSync } from "~/renderer/reducers/walletSync";
import { getSdk } from "@ledgerhq/trustchain/index";

import * as ReactQuery from "@tanstack/react-query";

const WalletSyncTestApp = () => (
  <>
    <div id="modals"></div>
    <WalletSyncRow />
  </>
);

jest.mock(
  "electron",
  () => ({ ipcRenderer: { on: jest.fn(), send: jest.fn(), invoke: jest.fn() } }),
  { virtual: true },
);

const mockedSdk = getSdk(true, {
  applicationId: 12,
  name: "LLD Integration",
});

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    destroyTrustchain: (mockedSdk.destroyTrustchain = jest.fn()),
    getMembers: (mockedSdk.getMembers = jest.fn()),
  }),
}));

jest.mock("@tanstack/react-query", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@tanstack/react-query"),
  };
});
jest
  .spyOn(ReactQuery, "useQuery")
  .mockImplementation(jest.fn().mockReturnValue({ data: [], isLoading: false, isSuccess: true }));

describe("ManageYourBackup", () => {
  it("should open drawer and display Wallet Sync Manage flow and delete your backup", async () => {
    const { user } = render(<WalletSyncTestApp />, {
      initialState: {
        walletSync: {
          ...initialStateWalletSync,
          flow: Flow.WalletSyncActivated,
          step: Step.WalletSyncActivated,
        },
        trustchainStore: {
          trustchain: {
            rootId: "rootId",
            deviceId: "deviceId",
            trustchainId: "trustchainId",
          },
        },
      },
    });

    //Open drawer
    const button = screen.getByRole("button", { name: "Manage" });
    await user.click(button);

    const row = screen.getByTestId("walletSync-manage-backup");
    await waitFor(() => expect(row).toBeDefined());

    await user.click(row);

    await waitFor(() =>
      expect(screen.getByTestId("walletSync-manage-backup-delete")).toBeDefined(),
    );
    const deleteCard = screen.getByTestId("walletSync-manage-backup-delete");
    await user.click(deleteCard);

    await waitFor(() =>
      expect(screen.getByText("Do you really want to delete your encryption key?")).toBeDefined(),
    );

    // First we cancel the deletion
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeDefined();

    await user.click(cancelButton);

    await waitFor(() => expect(screen.getByText("Manage your key")).toBeDefined());
    expect(screen.getByTestId("walletSync-manage-backup-delete")).toBeDefined();

    // go back to confirmation screen
    await user.click(screen.getByTestId("walletSync-manage-backup-delete"));
    await waitFor(() =>
      expect(screen.getByText("Do you really want to delete your encryption key?")).toBeDefined(),
    );

    // Then we do the deletion
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton);

    //Success message
    await waitFor(() =>
      expect(
        screen.getByText("Your devices have been unsynchronized and your key has been deleted"),
      ).toBeDefined(),
    );
  });
});
