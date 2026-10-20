import React from "react";
import { render, screen } from "@tests/test-renderer";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { makeStacksAccount, makeStakingPosition } from "../__mocks__/account.mock";

describe("Stacks AccountBalanceSummaryFooter", () => {
  it("renders nothing without a staking position", () => {
    const { toJSON } = render(<AccountBalanceSummaryFooter account={makeStacksAccount()} />);

    expect(toJSON()).toBeNull();
  });

  it("renders nothing when the staking position lookup failed", () => {
    const { toJSON } = render(
      <AccountBalanceSummaryFooter account={makeStacksAccount({}, null)} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("shows the staked amount and the unlock cycle", () => {
    render(
      <AccountBalanceSummaryFooter account={makeStacksAccount({}, [makeStakingPosition()])} />,
    );

    expect(screen.getByText("Staked")).toBeVisible();
    // 5_000_000 microSTX; the 10 STX spendable balance is the only other amount shown.
    expect(screen.getByText(/^5\sSTX$/)).toBeVisible();
    expect(screen.getByText("Unlock cycle")).toBeVisible();
    // firstRewardCycle (42) + numCycles (6)
    expect(screen.getByText("48")).toBeVisible();
  });

  it("hides the unlock cycle when the position doesn't carry pox-5 cycle details", () => {
    render(
      <AccountBalanceSummaryFooter
        account={makeStacksAccount({}, [makeStakingPosition({ details: {} })])}
      />,
    );

    expect(screen.getByText("Staked")).toBeVisible();
    expect(screen.queryByText("Unlock cycle")).toBeNull();
  });
});
