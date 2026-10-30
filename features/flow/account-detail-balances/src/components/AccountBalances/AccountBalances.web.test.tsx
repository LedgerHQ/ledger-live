import React from "react";
import { render, screen } from "@testing-library/react";
import { AccountBalances } from "./AccountBalances";
import type { BalanceItem } from "./AccountBalances.types";

const items: readonly BalanceItem[] = [
  { id: "available", label: "Available balance", value: "1.5 SOL", description: "Spendable now" },
  { id: "bandwidth", label: "Bandwidth", value: "600", sensitive: false },
];

describe("AccountBalances (Web)", () => {
  it("shows a card per item with its label and value", () => {
    render(<AccountBalances items={items} testID="balances" />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("1.5 SOL")).toBeInTheDocument();
    expect(screen.getByText("Bandwidth")).toBeInTheDocument();
    expect(screen.getByTestId("balances-bandwidth")).toBeInTheDocument();
  });

  it("explains an item that has a description", () => {
    render(<AccountBalances items={items} />);

    expect(screen.getByText("Spendable now")).toBeInTheDocument();
  });

  it("hides the values in discreet mode, except the ones that are not amounts", () => {
    render(<AccountBalances items={items} discreet />);

    expect(screen.queryByText("1.5 SOL")).toBeNull();
    expect(screen.getByText("***")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
  });

  it("renders nothing without items", () => {
    const { container } = render(<AccountBalances items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
