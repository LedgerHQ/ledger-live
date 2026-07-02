import BigNumber from "bignumber.js";
import React from "react";
import { render, screen } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import StakingSection from "./index";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";

jest.mock("~/renderer/hooks/useAccountUnit");

const mockUseAccountUnit = jest.mocked(useAccountUnit);

const makeAccount = (staking: Partial<AleoAccount["aleoResources"]>): AleoAccount => ({
  ...ALEO_ACCOUNT_1,
  blockHeight: 1000,
  aleoResources: {
    transparentBalance: new BigNumber(100),
    provableApi: null,
    privateBalance: null,
    unspentPrivateRecords: null,
    lastPrivateSyncDate: null,
    ...staking,
  },
});

describe("Aleo StakingSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccountUnit.mockReturnValue({ code: "ALEO", name: "Aleo", magnitude: 6 });
  });

  it("shows the empty state with an earn rewards CTA when there is no position", () => {
    render(<StakingSection account={makeAccount({})} />);
    expect(screen.getByRole("button", { name: /earn rewards/i })).toBeVisible();
  });

  it("renders a staked row with the validator when bonded", () => {
    render(
      <StakingSection
        account={makeAccount({
          bondedBalance: new BigNumber(5_000_000),
          bondedValidator: "aleo1validator",
        })}
      />,
    );
    expect(screen.getByText(/staked/i)).toBeVisible();
    expect(screen.getByText(/aleo1validator/)).toBeVisible();
    expect(screen.getByRole("button", { name: /unstake/i })).toBeEnabled();
  });

  it("renders a claimable row with an enabled Claim button once matured", () => {
    render(
      <StakingSection
        account={makeAccount({
          unbondingBalance: new BigNumber(2_000_000),
          unbondingHeight: 900, // blockHeight 1000 >= 900
        })}
      />,
    );
    expect(screen.getByText(/claimable/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /claim/i })).toBeEnabled();
  });

  it("disables the Claim button while still unbonding", () => {
    render(
      <StakingSection
        account={makeAccount({
          unbondingBalance: new BigNumber(2_000_000),
          unbondingHeight: 2000, // blockHeight 1000 < 2000
        })}
      />,
    );
    expect(screen.getByText(/unstaking/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /claim/i })).toBeDisabled();
  });
});
