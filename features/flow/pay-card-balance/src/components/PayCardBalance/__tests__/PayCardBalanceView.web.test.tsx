import React from "react";
import { screen } from "@testing-library/react";
import { PayCardBalanceView } from "../PayCardBalanceView.web";
import type { PayCardBalanceViewProps } from "../types";
import { formatCountervalue, labels, options } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

function fundedProps(overrides: Partial<PayCardBalanceViewProps> = {}): PayCardBalanceViewProps {
  return {
    displayMode: "funded",
    balance: 1000,
    formatCountervalue,
    isLoading: false,
    labels,
    filter: "all",
    options,
    isFilterOpen: false,
    onOpenFilter: jest.fn(),
    onCloseFilter: jest.fn(),
    onConfirmFilter: jest.fn(),
    ...overrides,
  } as PayCardBalanceViewProps;
}

function renderView(props: PayCardBalanceViewProps) {
  return renderWithStyle(<PayCardBalanceView {...props} />);
}

describe("PayCardBalanceView (Web)", () => {
  it("should render the empty title and description when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });

  it("should not render a balance when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.queryByTestId("pay-card-balance-funded-state")).not.toBeInTheDocument();
  });

  it("should render the funded balance and pill when funded", () => {
    renderView(fundedProps());

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
  });

  it("should not render the dialog contents while the filter is closed", () => {
    renderView(fundedProps({ isFilterOpen: false }));

    expect(screen.queryByTestId("pay-card-balance-filter-dialog")).not.toBeInTheDocument();
  });

  it("should render the dialog contents when the filter is open", () => {
    renderView(fundedProps({ isFilterOpen: true }));

    expect(screen.getByTestId("pay-card-balance-filter-dialog")).toBeVisible();
  });
});
