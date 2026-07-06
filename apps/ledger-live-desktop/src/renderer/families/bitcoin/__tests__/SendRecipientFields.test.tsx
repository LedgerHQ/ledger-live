import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import SendRecipientFields from "../SendRecipientFields";

const baseAccount = createFixtureAccount();

const buildBitcoinAccount = () => baseAccount;

// Helper to render the component (component prop from the exported object)
const renderComponent = (account: ReturnType<typeof createFixtureAccount>, flagEnabled = true) => {
  return render(<SendRecipientFields.component account={account as never} parentAccount={null} />, {
    initialState: withFlagOverrides({ zcashShielded: { enabled: flagEnabled } }),
  });
};

describe("SendRecipientFields — existing pending-operation alert regression", () => {
  it("renders no alert for a bitcoin account with no pending operations", () => {
    const account = buildBitcoinAccount();
    renderComponent(account, false);
    // No pending operations, no alert
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
