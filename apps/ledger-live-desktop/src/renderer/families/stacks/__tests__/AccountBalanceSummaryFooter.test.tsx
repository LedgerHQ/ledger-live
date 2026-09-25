import React from "react";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { StacksAccount, StakingPosition } from "@ledgerhq/live-common/families/stacks/types";
import type { TokenAccount } from "@ledgerhq/types-live";
import { render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
}));

jest.mock("~/renderer/hooks/useAccountUnit");

import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";

const currency = getCryptoCurrencyById("stacks");

const SPENDABLE = new BigNumber(1_000_000);
const STAKED = new BigNumber(300_000);

const makeAccount = (stakingPositions?: StakingPosition[]): StacksAccount => {
  const account = {
    ...genAccount("stacks-test", { currency }),
    spendableBalance: SPENDABLE,
    stakingPositions,
  } as unknown as StacksAccount;
  if (account.type !== "Account") {
    throw new Error("makeAccount expected type=Account; tests would pass vacuously otherwise");
  }
  return account;
};

const makePosition = (): StakingPosition =>
  ({
    uid: "SP1staker",
    address: "SP1staker",
    delegate: "SP1pool.native-pool-signer-manager",
    state: "active",
    asset: { type: "native" },
    amount: STAKED,
    actions: ["undelegate"],
    details: { firstRewardCycle: 10, numCycles: 6, rewardAsset: "sbtc", amountRewarded: "0" },
  }) as unknown as StakingPosition;

beforeEach(() => {
  jest.spyOn(currencies, "formatCurrencyUnit").mockImplementation((_unit, value) => {
    if (!value) return "";
    if (value.eq(SPENDABLE)) return "available:1.0";
    if (value.eq(STAKED)) return "staked:0.3";
    return value.toString();
  });
});

describe("AccountBalanceSummaryFooter (stacks)", () => {
  it("renders only Available balance when there is no staking position", () => {
    render(<AccountBalanceSummaryFooter account={makeAccount(undefined)} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("available:1.0")).toBeInTheDocument();
    expect(screen.queryByText("Staked")).not.toBeInTheDocument();
    expect(screen.queryByText("Unlock cycle")).not.toBeInTheDocument();
  });

  it("renders Staked + Unlock cycle with correct values when a position is present", () => {
    render(<AccountBalanceSummaryFooter account={makeAccount([makePosition()])} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("Staked")).toBeInTheDocument();
    expect(screen.getByText("staked:0.3")).toBeInTheDocument();
    expect(screen.getByText("Unlock cycle")).toBeInTheDocument();
    expect(screen.getByText("16")).toBeInTheDocument();
  });

  it("renders nothing for a TokenAccount", () => {
    const tokenAccount = { type: "TokenAccount", id: "stub" } as unknown as TokenAccount;
    const { container } = render(<AccountBalanceSummaryFooter account={tokenAccount} />);
    expect(container.firstChild).toBeNull();
  });
});
