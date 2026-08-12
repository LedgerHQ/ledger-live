import React from "react";
import { screen } from "@testing-library/react";
import { BalanceFilterDialogView } from "../BalanceFilterDialogView.web";
import type { BalanceFilterDialogViewProps } from "../BalanceFilterDialogView.web";
import { USDC_ID, labels, options } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

function buildProps(
  overrides: Partial<BalanceFilterDialogViewProps> = {},
): BalanceFilterDialogViewProps {
  return {
    isOpen: true,
    draftFilter: "all",
    options,
    labels,
    onClose: jest.fn(),
    onSelectDraft: jest.fn(),
    onConfirm: jest.fn(),
    ...overrides,
  };
}

function renderView(props: BalanceFilterDialogViewProps) {
  return renderWithStyle(<BalanceFilterDialogView {...props} />);
}

describe("BalanceFilterDialogView (Web)", () => {
  it("should render nothing when closed", () => {
    renderView(buildProps({ isOpen: false }));

    expect(screen.queryByTestId("pay-card-balance-filter-dialog")).not.toBeInTheDocument();
  });

  it("should render one row per option with tickers and crypto amounts", () => {
    renderView(buildProps());

    expect(screen.getByTestId("pay-card-balance-filter-dialog")).toBeVisible();
    expect(screen.getByText("All stablecoins")).toBeVisible();
    expect(screen.getByText("USD Coin")).toBeVisible();
    expect(screen.getByText("USDC")).toBeVisible();
    expect(screen.getByText("1,000.00 USDC")).toBeVisible();
    expect(screen.getByText("Tether USD")).toBeVisible();
  });

  it("should select an option when its row is pressed", async () => {
    const onSelectDraft = jest.fn();
    renderView(buildProps({ onSelectDraft }));

    await screen.getByTestId("pay-card-balance-filter-option-usdc").click();

    expect(onSelectDraft).toHaveBeenCalledWith(USDC_ID);
  });

  it("should confirm when the confirm button is pressed", async () => {
    const onConfirm = jest.fn();
    renderView(buildProps({ onConfirm }));

    await screen.getByTestId("pay-card-balance-filter-confirm").click();

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
