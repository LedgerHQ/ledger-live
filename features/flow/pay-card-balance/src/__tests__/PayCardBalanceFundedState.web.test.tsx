import React from "react";
import { screen } from "@testing-library/react";
import { PayCardBalanceFundedState } from "../components/Hero/PayCardBalanceFundedState.web";
import { depositActionTiles, fundedStateProps, usdcOption } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

describe("PayCardBalanceFundedState (Web)", () => {
  it("should render the funded balance and the filter pill", () => {
    renderWithStyle(<PayCardBalanceFundedState {...fundedStateProps} />);

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
  });

  it("should render the selected coin ticker on the pill", () => {
    renderWithStyle(
      <PayCardBalanceFundedState {...fundedStateProps} selectedOption={usdcOption} />,
    );

    expect(screen.getByText("USDC")).toBeVisible();
  });

  it("should open the filter when the pill is pressed", async () => {
    const onOpenFilter = jest.fn();
    renderWithStyle(
      <PayCardBalanceFundedState {...fundedStateProps} onOpenFilter={onOpenFilter} />,
    );

    await screen.getByTestId("pay-card-balance-filter-pill").click();

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });

  it("should render the action tiles when provided", () => {
    renderWithStyle(
      <PayCardBalanceFundedState {...fundedStateProps} actionTiles={depositActionTiles} />,
    );

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });
});
