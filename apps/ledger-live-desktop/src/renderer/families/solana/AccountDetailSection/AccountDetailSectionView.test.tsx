import React from "react";
import { render, screen } from "tests/testSetup";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import { AccountDetailSectionView } from "./AccountDetailSectionView";

jest.mock("../AccountDetailBalanceSummary", () => ({
  __esModule: true,
  default: () => <div data-testid="balance-summary" />,
}));
jest.mock("../AccountDetailDelegations", () => ({
  __esModule: true,
  default: () => <div data-testid="delegations" />,
}));

const account = { type: "Account" } as SolanaAccount;

describe("AccountDetailSectionView", () => {
  it("renders the balance summary and the delegations", () => {
    render(<AccountDetailSectionView account={account} showBalanceSummary showDelegations />);

    expect(screen.getByTestId("balance-summary")).toBeVisible();
    expect(screen.getByTestId("delegations")).toBeVisible();
  });

  it("renders nothing when the staking blocks are hidden", () => {
    const { container } = render(
      <AccountDetailSectionView
        account={account}
        showBalanceSummary={false}
        showDelegations={false}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
