import React from "react";
import { render, screen } from "@testing-library/react";
import { AccountBalanceSummary } from "./AccountBalanceSummary";
import type { BalanceItem } from "./AccountBalanceSummary.types";

const items: readonly BalanceItem[] = [
  { id: "available", label: "Available balance", value: "1.5 SOL", description: "Spendable now" },
  { id: "bandwidth", label: "Bandwidth", value: "600", sensitive: false },
];

describe("AccountBalanceSummary (Web)", () => {
  it("shows a card per item with its label and value", () => {
    render(<AccountBalanceSummary items={items} testID="balances" />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText("1.5 SOL")).toBeInTheDocument();
    expect(screen.getByText("Bandwidth")).toBeInTheDocument();
    expect(screen.getByTestId("balances-bandwidth")).toBeInTheDocument();
  });

  it("explains an item that has a description", () => {
    render(<AccountBalanceSummary items={items} />);

    expect(screen.getByText("Spendable now")).toBeInTheDocument();
  });

  it("makes the explanation reachable with the keyboard", () => {
    render(<AccountBalanceSummary items={items} />);

    const trigger = screen.getByRole("button", { name: "Available balance" });

    trigger.focus();

    expect(trigger).toHaveFocus();
  });

  it("gives no keyboard stop to an item without description", () => {
    render(<AccountBalanceSummary items={items} />);

    expect(screen.queryByRole("button", { name: "Bandwidth" })).toBeNull();
  });

  it("hides the values in discreet mode, except the ones that are not amounts", () => {
    render(<AccountBalanceSummary items={items} discreet />);

    expect(screen.queryByText("1.5 SOL")).toBeNull();
    expect(screen.getByText("***")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
  });

  it("renders nothing without items", () => {
    const { container } = render(<AccountBalanceSummary items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
