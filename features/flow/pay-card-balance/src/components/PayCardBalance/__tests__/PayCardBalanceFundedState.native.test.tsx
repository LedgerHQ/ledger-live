import React from "react";
import { render, screen } from "@testing-library/react-native";
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
  it("should render the funded balance", () => {
    render(
      <PayCardBalanceFundedState
        balance={1000}
        formatCountervalue={formatCountervalue}
        isLoading={false}
      />,
    );

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeTruthy();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeTruthy();
  });
});
