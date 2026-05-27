import React from "react";
import { render, screen } from "tests/testSetup";
import { STAKING_SECTION_TEST_ID, StakingSectionView } from "../StakingSectionView";
import type { StakingSectionViewModelResult } from "../useStakingSectionViewModel";

const baseViewModel: StakingSectionViewModelResult = {
  state: { type: "hidden" },
  availableBalanceTooltip:
    "The portion of your holdings you can use right now, free to send, swap, or withdraw at any time.",
  availableBalanceLabel: "Available balance",
  earnDepositLabel: "Earn deposit",
  earnBannerSubtitle: "Hold and earn with this asset",
  earnBannerActionLabel: "Go to Earn",
  onEarnBannerPress: jest.fn(),
  onEarnDepositPress: jest.fn(),
};

describe("StakingSectionView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when state is hidden", () => {
    render(<StakingSectionView {...baseViewModel} />);

    expect(screen.queryByTestId(STAKING_SECTION_TEST_ID)).not.toBeInTheDocument();
    expect(screen.queryByTestId("asset-detail-earn-banner")).not.toBeInTheDocument();
  });

  it("renders the earn banner when state is banner", () => {
    render(
      <StakingSectionView
        {...baseViewModel}
        state={{ type: "banner", label: "Earn up to 12.0% APY" }}
      />,
    );

    expect(screen.getByTestId(STAKING_SECTION_TEST_ID)).toBeInTheDocument();
    expect(screen.getByTestId("asset-detail-earn-banner")).toBeVisible();
    expect(screen.getByText("Earn up to 12.0% APY")).toBeVisible();
    expect(screen.getByText("Hold and earn with this asset")).toBeVisible();
  });

  it("renders available balance and earn deposit cards when state is staked", () => {
    render(
      <StakingSectionView
        {...baseViewModel}
        state={{
          type: "staked",
          formattedAvailable: "$0.00",
          formattedDeposit: "$200.00",
        }}
      />,
    );

    expect(screen.getByTestId("asset-detail-available-balance")).toBeVisible();
    expect(screen.getByTestId("asset-detail-earn-deposit")).toBeVisible();
    expect(screen.getByText("$0.00")).toBeVisible();
    expect(screen.getByText("$200.00")).toBeVisible();
  });

  it("spans two columns for the earn banner when PnL is visible", () => {
    render(
      <StakingSectionView
        {...baseViewModel}
        pnlVisible
        state={{ type: "banner", label: "Earn up to 12.0% APY" }}
      />,
    );

    expect(screen.getByTestId("asset-detail-earn-banner")).toHaveClass("flex-[2]");
  });
});
