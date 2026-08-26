import React from "react";
import { screen } from "@testing-library/react";
import { BalanceView } from "../components/Hero/BalanceView.web";
import type { BalanceViewProps } from "../types";
import { depositActionTiles, formatCountervalue, labels, options } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

function fundedProps(overrides: Partial<BalanceViewProps> = {}): BalanceViewProps {
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
  } as BalanceViewProps;
}

function renderView(props: BalanceViewProps) {
  return renderWithStyle(<BalanceView {...props} />);
}

describe("BalanceView (Web)", () => {
  it("should render the empty title and description when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });

  it("should not render a balance when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.queryByTestId("pay-card-balance-funded-state")).not.toBeInTheDocument();
  });

  it("should render action tiles when empty", () => {
    renderView({ displayMode: "empty", labels, actionTiles: depositActionTiles });

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });

  it("should render action tiles when funded", () => {
    renderView(fundedProps({ actionTiles: depositActionTiles }));

    expect(screen.getByTestId("action-tile-deposit")).toBeVisible();
  });

  it("should render the funded balance and pill when funded", () => {
    renderView(fundedProps());

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-filter-pill")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
  });

  it("should not render the dialog contents while the filter is closed", () => {
    renderView(fundedProps({ isFilterOpen: false }));

    expect(screen.queryByTestId("pay-card-balance-filter-picker")).not.toBeInTheDocument();
  });

  it("should render the dialog contents when the filter is open", () => {
    renderView(fundedProps({ isFilterOpen: true }));

    expect(screen.getByTestId("pay-card-balance-filter-picker")).toBeVisible();
  });
});
