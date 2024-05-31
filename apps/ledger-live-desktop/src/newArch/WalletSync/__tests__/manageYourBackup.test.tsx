/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { describe, it, expect, jest } from "@jest/globals";

import React from "react";
import { render, screen, waitFor } from "tests/testUtils";
import WalletSyncRow from "~/renderer/screens/settings/sections/General/WalletSync";
import { State } from "~/renderer/reducers";

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

describe("ManageYourBackup", () => {
  it("should open drawer and display Wallet Sync Manage flow and delete your backup", async () => {
    const { user } = render(<WalletSyncTestApp />, {
      overrideInitialState: (state: State) => ({
        ...state,
        walletSync: {
          ...state.walletSync,
          activated: true,
        },
      }),
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
      expect(screen.getByText("Do you really want to delete your data?")).toBeDefined(),
    );

    // First we cancel the deletion
    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    expect(cancelButton).toBeDefined();

    await user.click(cancelButton);

    await waitFor(() => expect(screen.getByText("Manage your backup")).toBeDefined());
    expect(screen.getByTestId("walletSync-manage-backup-delete")).toBeDefined();

    // go back to confirmation screen
    await user.click(screen.getByTestId("walletSync-manage-backup-delete"));
    await waitFor(() =>
      expect(screen.getByText("Do you really want to delete your data?")).toBeDefined(),
    );

    // Then we do the deletion
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton);

    //Success message
    await waitFor(() => expect(screen.getByText("All data successfully deleted")).toBeDefined());
  });
});
