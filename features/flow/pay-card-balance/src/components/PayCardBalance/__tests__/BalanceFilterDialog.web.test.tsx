import React from "react";
import { screen } from "@testing-library/react";
import { BalanceFilterDialog } from "../BalanceFilterDialog.web";
import type { BalanceFilterDialogProps } from "../BalanceFilterDialog.web";
import { USDT_ID, labels, options } from "./fixtures";
import { renderWithStyle } from "./renderWithStyle.web";

function buildProps(overrides: Partial<BalanceFilterDialogProps> = {}): BalanceFilterDialogProps {
  return {
    isOpen: true,
    filter: "all",
    options,
    labels,
    onClose: jest.fn(),
    onConfirmFilter: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
}

function renderDialog(props: BalanceFilterDialogProps) {
  return renderWithStyle(<BalanceFilterDialog {...props} />);
}

describe("BalanceFilterDialog (Web)", () => {
  it("should confirm the selected filter and close when confirming", async () => {
    const onClose = jest.fn();
    const onConfirmFilter = jest.fn();
    renderDialog(buildProps({ onClose, onConfirmFilter }));

    await screen.getByTestId("pay-card-balance-filter-option-usdt").click();
    await screen.getByTestId("pay-card-balance-filter-confirm").click();

    expect(onConfirmFilter).toHaveBeenCalledWith(USDT_ID);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
