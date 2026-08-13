import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { FormattedValue } from "../types";
import { PayCardBalanceFundedState } from "../PayCardBalanceFundedState.native";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(value),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("PayCardBalanceFundedState (Native)", () => {
  it("should render the funded balance and the filter select", () => {
    render(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        onOpenFilter={jest.fn()}
      />,
    );

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeTruthy();
  });

  it("should open the filter when the select is pressed", () => {
    const onOpenFilter = jest.fn();
    render(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        allStablecoinsLabel="All stablecoins"
        onOpenFilter={onOpenFilter}
      />,
    );

    fireEvent.press(screen.getByTestId("pay-card-balance-filter-pill"));

    expect(onOpenFilter).toHaveBeenCalledTimes(1);
  });

  it("should render the action tiles when provided", () => {
    render(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
        actionTiles={{
          page: "Pay",
          tiles: [{ id: "deposit", label: "Deposit", onPress: jest.fn() }],
        }}
      />,
    );

    expect(screen.getByTestId("action-tile-deposit")).toBeTruthy();
  });
});
