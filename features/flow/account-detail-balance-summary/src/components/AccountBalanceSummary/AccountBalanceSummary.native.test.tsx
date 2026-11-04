import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AccountBalanceSummary } from "./AccountBalanceSummary";
import type { BalanceItem } from "./AccountBalanceSummary.types";

const items: readonly BalanceItem[] = [
  { id: "available", label: "Available balance", value: "1.5 TRX", description: "Spendable now" },
  { id: "frozen", label: "Frozen", value: "52", sensitive: false },
  { id: "energy", label: "Energy", value: "-", sensitive: false },
];

describe("AccountBalanceSummary (Native)", () => {
  it("shows a card per item, two per row", () => {
    render(<AccountBalanceSummary items={items} testID="balances" />);

    expect(screen.getByText("Available balance")).toBeVisible();
    expect(screen.getByText("1.5 TRX")).toBeVisible();
    expect(screen.getByTestId("balances-energy")).toBeVisible();
  });

  it("opens an info sheet for an item that has a description", async () => {
    const user = userEvent.setup();
    render(<AccountBalanceSummary items={items} testID="balances" />);

    await user.press(screen.getByTestId("balances-available"));

    expect(screen.getByText("Spendable now")).toBeVisible();
  });

  it("hides the amounts in discreet mode, except the ones that are not amounts", () => {
    render(<AccountBalanceSummary items={items} discreet />);

    expect(screen.queryByText("1.5 TRX")).toBeNull();
    expect(screen.getByText("***")).toBeVisible();
    expect(screen.getByText("52")).toBeVisible();
  });

  it("renders nothing without items", () => {
    render(<AccountBalanceSummary items={[]} testID="balances" />);

    expect(screen.queryByTestId("balances")).toBeNull();
  });
});
