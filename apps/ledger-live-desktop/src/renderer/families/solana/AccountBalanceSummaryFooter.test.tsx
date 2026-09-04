import React from "react";
import BigNumber from "bignumber.js";
import { render, screen } from "tests/testSetup";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";

const position = (overrides: Record<string, unknown> = {}) => ({
  positionId: "stake-acc-1",
  validatorAddress: "vote-acc-1",
  status: "bonded",
  pendingRewards: new BigNumber(0),
  amount: new BigNumber(2_000_000_000),
  ...overrides,
});

const solanaAccount = (delegations: unknown[] = []): SolanaAccount =>
  ({
    type: "Account",
    currency: {
      id: "solana",
      units: [{ code: "SOL", name: "SOL", magnitude: 9 }],
    },
    spendableBalance: new BigNumber(1_000_000_000),
    stakingResources: { delegations, redelegations: [], unbondings: [] },
  }) as unknown as SolanaAccount;

describe("solana AccountBalanceSummaryFooter", () => {
  it("sums the delegated amounts across every staking position", () => {
    render(
      <AccountBalanceSummaryFooter
        account={solanaAccount([position(), position({ amount: new BigNumber(3_000_000_000) })])}
      />,
    );

    expect(screen.getByText("1 SOL")).toBeVisible();
    expect(screen.getByText("5 SOL")).toBeVisible();
  });

  it("shows zero delegated when the account has no staking position", () => {
    render(<AccountBalanceSummaryFooter account={solanaAccount()} />);

    expect(screen.getByText("0 SOL")).toBeVisible();
  });

  it("surfaces the inactive stake only when there is some", () => {
    const { rerender } = render(
      <AccountBalanceSummaryFooter account={solanaAccount([position()])} />,
    );
    expect(screen.queryByText("solana.delegation.inactiveStake")).not.toBeInTheDocument();

    rerender(
      <AccountBalanceSummaryFooter
        account={solanaAccount([position({ inactiveAmount: new BigNumber(4_000_000_000) })])}
      />,
    );
    expect(screen.getByText("4 SOL")).toBeVisible();
  });

  it("sums the withdrawable amounts across positions", () => {
    render(
      <AccountBalanceSummaryFooter
        account={solanaAccount([
          position({ withdrawableAmount: new BigNumber(500_000_000) }),
          position({ withdrawableAmount: new BigNumber(1_500_000_000) }),
        ])}
      />,
    );

    expect(screen.getByText("2 SOL")).toBeVisible();
  });
});
