/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testSetup";
import BackupDeleted from "../screens/ManageBackup/02-FinalStep";

jest.mock("../hooks/useLedgerSyncAnalytics", () => ({
  ...jest.requireActual("../hooks/useLedgerSyncAnalytics"),
  useLedgerSyncAnalytics: () => ({
    onClickTrack: jest.fn(),
  }),
}));

describe("BackupDeleted", () => {
  it("should show delete backup success message, not Sync complete", () => {
    render(<BackupDeleted isSuccessful />);

    expect(screen.getByText("Your Ledger Wallet apps are no longer synced")).toBeInTheDocument();
    expect(screen.getByText("You can turn on sync anytime")).toBeInTheDocument();
    expect(screen.queryByText("Sync complete")).not.toBeInTheDocument();
  });

  it("should show error state when isSuccessful is false", () => {
    render(<BackupDeleted isSuccessful={false} />);

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.queryByText("Your Ledger Wallet apps are no longer synced"),
    ).not.toBeInTheDocument();
  });
});
