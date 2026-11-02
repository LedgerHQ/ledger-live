import React from "react";
import BigNumber from "bignumber.js";
import { render, screen, within } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { SolanaAccount } from "@ledgerhq/live-common/families/solana/types";
import type {
  AccountLike,
  StakingDelegation,
  StakingResources,
  StakingUnbonding,
} from "@ledgerhq/types-live";
import AccountDetailBalanceSummary from "./AccountDetailBalanceSummary";

const NBSP = " ";
const SOL = (value: number) => new BigNumber(value).times(1e9);

const delegation = (overrides: Partial<StakingDelegation> = {}): StakingDelegation => ({
  positionId: "stake-bonded",
  validatorAddress: "vote-bonded",
  amount: SOL(2),
  activeAmount: SOL(2),
  inactiveAmount: new BigNumber(0),
  withdrawableAmount: new BigNumber(0),
  pendingRewards: new BigNumber(0),
  status: "bonded",
  ...overrides,
});

const unbonding = (overrides: Partial<StakingUnbonding> = {}): StakingUnbonding => ({
  positionId: "stake-inactive",
  validatorAddress: "vote-inactive",
  amount: SOL(1),
  activeAmount: new BigNumber(0),
  inactiveAmount: SOL(1),
  withdrawableAmount: SOL(0.5),
  completionDate: new Date(0),
  status: "withdrawable",
  ...overrides,
});

const accountWith = (stakes: {
  delegations?: StakingDelegation[];
  unbondings?: StakingUnbonding[];
}): SolanaAccount =>
  ({
    type: "Account",
    id: "solana-account",
    currency: getCryptoCurrencyById("solana"),
    spendableBalance: SOL(5),
    stakingResources: {
      delegations: stakes.delegations ?? [],
      redelegations: [],
      unbondings: stakes.unbondings ?? [],
    } as unknown as StakingResources,
  }) as unknown as SolanaAccount;

const card = (id: string) => screen.queryByTestId(`account-detail-solana-balance-summary-${id}`);

describe("Solana AccountDetailBalanceSummary", () => {
  it("shows the available balance and the delegated amount", () => {
    render(<AccountDetailBalanceSummary account={accountWith({ delegations: [delegation()] })} />);

    expect(within(card("available")!).getByText(`5${NBSP}SOL`)).toBeVisible();
    expect(within(card("delegated")!).getByText(`2${NBSP}SOL`)).toBeVisible();
  });

  it("sums the delegated amount over every stake", () => {
    const account = accountWith({
      delegations: [delegation(), delegation({ positionId: "stake-2", amount: SOL(3) })],
    });

    render(<AccountDetailBalanceSummary account={account} />);

    expect(within(card("delegated")!).getByText(`5${NBSP}SOL`)).toBeVisible();
  });

  it("only shows the inactive and withdrawable amounts when there are some", () => {
    render(<AccountDetailBalanceSummary account={accountWith({ delegations: [delegation()] })} />);

    expect(card("inactive")).toBeNull();
    expect(card("withdrawable")).toBeNull();
  });

  it("shows the inactive and withdrawable amounts of the stakes", () => {
    render(<AccountDetailBalanceSummary account={accountWith({ unbondings: [unbonding()] })} />);

    expect(within(card("inactive")!).getByText(`1${NBSP}SOL`)).toBeVisible();
    expect(within(card("withdrawable")!).getByText(`0.5${NBSP}SOL`)).toBeVisible();
  });

  it("shows a zero delegated amount without stake", () => {
    render(<AccountDetailBalanceSummary account={accountWith({})} />);

    expect(within(card("delegated")!).getByText(`0${NBSP}SOL`)).toBeVisible();
  });

  it("renders nothing for an account without staking resources", () => {
    render(<AccountDetailBalanceSummary account={{ type: "TokenAccount" } as AccountLike} />);

    expect(card("available")).toBeNull();
  });
});
