import React from "react";
import { screen } from "@testing-library/react";
import { PayCardBalanceFundedState } from "../PayCardBalanceFundedState.web";
import { formatCountervalue, usdcOption } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

describe("PayCardBalanceFundedState (Web)", () => {
  it("should render the funded balance and the filter pill", () => {
    renderWithStyle(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        onOpenFilter={jest.fn()}
      />,
    );

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
  });

  it("should render the selected coin ticker on the pill", () => {
    renderWithStyle(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        selectedOption={usdcOption}
        onOpenFilter={jest.fn()}
      />,
    );

    expect(screen.getByText("USDC")).toBeVisible();
  });

  it("should open the filter when the pill is pressed", async () => {
    const onOpenFilter = jest.fn();
    renderWithStyle(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        onOpenFilter={onOpenFilter}
      />,
    );

    await screen.getByTestId("pay-card-balance-filter-pill").click();

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });

  it("should render the action tiles when provided", () => {
    renderWithStyle(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        onOpenFilter={jest.fn()}
        actionTiles={{
          page: "Pay",
          tiles: [{ id: "deposit", label: "Deposit", onPress: jest.fn() }],
        }}
      />,
    );

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });
});
