import React from "react";
import { render, screen } from "tests/testSetup";
import { PerpsAccountSelector } from "../PerpsAccountSelector";

const baseProps = {
  title: "Deposit with USDC",
  ticker: "USDC",
  ledgerId: "arbitrum/erc20/usd_coin",
  accountName: "USDC 1",
  counterValue: "$100.00",
  accountLabelKey: "perpsDeposit.selectCurrencyAccount",
  noAccountLabel: "No account",
  exceedsBalance: false,
  missingAccount: false,
  onSelect: jest.fn(),
  testId: "perps-test-select-currency",
};

describe("PerpsAccountSelector", () => {
  it("shows the title, account name and balance", () => {
    render(<PerpsAccountSelector {...baseProps} />);

    expect(screen.getByText("Deposit with USDC")).toBeVisible();
    expect(screen.getByText(/USDC 1/)).toBeVisible();
    expect(screen.getByText("$100.00")).toBeVisible();
  });

  it("flags the balance when the amount exceeds it", () => {
    render(<PerpsAccountSelector {...baseProps} exceedsBalance />);

    expect(screen.getByText("$100.00")).toHaveClass("text-error");
  });

  it("shows only the account name when the balance is unknown", () => {
    render(<PerpsAccountSelector {...baseProps} counterValue={null} />);

    expect(screen.getByText("USDC 1")).toBeVisible();
    expect(screen.queryByText("$100.00")).not.toBeInTheDocument();
  });

  it("shows the no-account label, in error when an account is required", () => {
    render(<PerpsAccountSelector {...baseProps} accountName={null} missingAccount />);

    expect(screen.getByText("No account")).toHaveClass("text-error");
  });

  it("opens the account selection when clicked", async () => {
    const onSelect = jest.fn();
    const { user } = render(<PerpsAccountSelector {...baseProps} onSelect={onSelect} />);

    await user.click(screen.getByTestId("perps-test-select-currency"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
