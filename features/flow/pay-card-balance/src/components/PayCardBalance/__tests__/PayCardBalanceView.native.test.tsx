import React from "react";
import { render, screen } from "@testing-library/react-native";
import type { FormattedValue, PayCardBalanceViewProps } from "../types";
import { PayCardBalanceView } from "../PayCardBalanceView.native";
import { labels } from "./fixtures";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(value),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderView(props: PayCardBalanceViewProps) {
  return render(<PayCardBalanceView {...props} />);
}

describe("PayCardBalanceView (Native)", () => {
  it("should render the empty title and description when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });

  it("should not render a balance when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.queryByTestId("pay-card-balance-funded-state")).toBeNull();
  });

  it("should render the funded balance when funded", () => {
    renderView({
      displayMode: "funded",
      balance: 1000,
      formatCountervalue,
      filter: "all",
      options: [],
      isFilterOpen: false,
      onOpenFilter: jest.fn(),
      onCloseFilter: jest.fn(),
      onConfirmFilter: jest.fn(),
      isLoading: false,
      labels,
    });

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).toBeNull();
  });
});
