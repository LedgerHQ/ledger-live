import React from "react";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import { Transaction } from "@ledgerhq/live-common/families/bitcoin/types";
import SendRecipientFields from "../SendRecipientFields";

// The bridge's updateTransaction merges the patch onto the transaction.
// Mocking it also avoids the Suspense boundary that useAccountBridge (React `use`) requires.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: () => ({
    updateTransaction: (tx: Transaction, patch: Partial<Transaction>) => ({ ...tx, ...patch }),
  }),
}));

const baseAccount = createFixtureAccount();

const buildBitcoinAccount = () => baseAccount;

const renderComponent = (account: ReturnType<typeof createFixtureAccount>) =>
  render(
    <SendRecipientFields.component
      account={account as never}
      parentAccount={null}
      transaction={{} as never}
      status={{ errors: {}, warnings: {} } as never}
      onChange={jest.fn()}
    />,
  );

describe("SendRecipientFields — existing pending-operation alert regression", () => {
  it("renders no alert for a bitcoin account with no pending operations", () => {
    const account = buildBitcoinAccount();
    renderComponent(account);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
