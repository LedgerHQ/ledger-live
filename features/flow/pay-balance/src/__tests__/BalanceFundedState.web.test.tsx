import React from "react";
import { screen } from "@testing-library/react";
import { BalanceFundedState } from "../components/Hero/BalanceFundedState.web";
import { fundedStateProps, usdcOption } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

describe("BalanceFundedState (Web)", () => {
  it("should render the funded balance and the filter pill", () => {
    renderWithStyle(<BalanceFundedState {...fundedStateProps} />);

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
  });

  it("should render the selected coin ticker on the pill", () => {
    renderWithStyle(<BalanceFundedState {...fundedStateProps} selectedOption={usdcOption} />);

    expect(screen.getByText("USDC")).toBeVisible();
  });

  it("should open the filter when the pill is pressed", async () => {
    const onOpenFilter = jest.fn();
    renderWithStyle(<BalanceFundedState {...fundedStateProps} onOpenFilter={onOpenFilter} />);

    await screen.getByTestId("pay-card-balance-filter-pill").click();

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });
});
