import React from "react";
import { render, screen } from "@tests/test-renderer";
import { PerpsAccountSelector } from "../PerpsAccountSelector";

const baseProps = {
  title: "Withdraw to ETH",
  ticker: "ETH",
  ledgerId: "ethereum",
  description: "Ethereum 1 · $1,000.00",
  hasError: false,
  onSelect: jest.fn(),
  testID: "perps-test-select-currency",
};

describe("PerpsAccountSelector", () => {
  it("shows the title and the account description", () => {
    render(<PerpsAccountSelector {...baseProps} />);

    expect(screen.getByText("Withdraw to ETH")).toBeOnTheScreen();
    expect(screen.getByText("Ethereum 1 · $1,000.00")).toBeOnTheScreen();
  });

  it("opens the account selection when pressed", async () => {
    const onSelect = jest.fn();
    const { user } = render(<PerpsAccountSelector {...baseProps} onSelect={onSelect} />);

    await user.press(screen.getByTestId("perps-test-select-currency"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
