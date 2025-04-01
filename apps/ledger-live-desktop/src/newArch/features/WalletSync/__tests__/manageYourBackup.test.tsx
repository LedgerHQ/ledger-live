import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { WalletSyncTestApp, mockedSdk, simpleTrustChain, walletSyncActivatedState } from "./shared";

import * as ReactQuery from "@tanstack/react-query";

jest.mock("../hooks/useTrustchainSdk", () => ({
  useTrustchainSdk: () => ({
    destroyTrustchain: (mockedSdk.destroyTrustchain = jest.fn()),
    getMembers: (mockedSdk.getMembers = jest.fn()),
    initMemberCredentials: (mockedSdk.initMemberCredentials = jest.fn()),
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
        walletSync: walletSyncActivatedState,
        trustchain: {
          trustchain: simpleTrustChain,
        },
      },
    });

    //Open drawer
    const button = screen.getByRole("button", { name: "Manage" });
    await user.click(button);

    const row = await screen.findByTestId("walletSync-manage-backup");

    await user.click(row);

    // First we cancel the deletion
    const cancelButton = screen.getByRole("button", { name: "Keep sync" });
    expect(cancelButton).toBeDefined();

    await user.click(cancelButton);

    await waitFor(() => expect(row).toBeDefined());
    await user.click(screen.getByText(/Delete sync/i));

    // Then we do the deletion
    const deleteButton = screen.getByRole("button", { name: "Yes, delete" });
    expect(deleteButton).toBeDefined();
    await user.click(deleteButton);

    //Success message
    expect(await screen.findByText("Your Ledger Live apps are no longer synched")).toBeDefined();
  });
});
