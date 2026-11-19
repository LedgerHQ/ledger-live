import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import { createFixtureAccount } from "@ledgerhq/coin-bitcoin/fixtures/common.fixtures";
import SendRecipientFields from "../SendRecipientFields";

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

describe("SendRecipientFields — pending-operation alert", () => {
  it("renders no alert for an account with no pending operations", () => {
    renderComponent(createFixtureAccount());
    expect(screen.queryByText(/You have incoming transactions pending/)).not.toBeInTheDocument();
  });

  it("renders the alert when an incoming operation is unconfirmed", () => {
    const account = createFixtureAccount();
    renderComponent({
      ...account,
      pendingOperations: [
        { id: "op", type: "IN", hash: "h", blockHeight: null, value: new BigNumber(1) },
      ],
    } as never);
    expect(screen.getByText(/You have incoming transactions pending/)).toBeInTheDocument();
  });
});
