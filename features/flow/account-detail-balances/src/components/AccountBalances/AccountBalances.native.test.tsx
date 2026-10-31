import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { AccountBalances } from "./AccountBalances";
import type { BalanceItem } from "./AccountBalances.types";

const items: readonly BalanceItem[] = [
  { id: "available", label: "Available balance", value: "1.5 TRX", description: "Spendable now" },
  { id: "frozen", label: "Frozen", value: "52", sensitive: false },
  { id: "energy", label: "Energy", value: "-", sensitive: false },
];

describe("AccountBalances (Native)", () => {
  it("shows a card per item, two per row", () => {
    render(<AccountBalances items={items} testID="balances" />);

    expect(screen.getByText("Available balance")).toBeVisible();
    expect(screen.getByText("1.5 TRX")).toBeVisible();
    expect(screen.getByTestId("balances-energy")).toBeVisible();
  });

  it("opens an info sheet for an item that has a description", async () => {
    const user = userEvent.setup();
    render(<AccountBalances items={items} testID="balances" />);

    await user.press(screen.getByTestId("balances-available"));

    expect(screen.getByText("Spendable now")).toBeVisible();
  });

  it("hides the amounts in discreet mode, except the ones that are not amounts", () => {
    render(<AccountBalances items={items} discreet />);

    expect(screen.queryByText("1.5 TRX")).toBeNull();
    expect(screen.getByText("***")).toBeVisible();
    expect(screen.getByText("52")).toBeVisible();
  });

  it("renders nothing without items", () => {
    render(<AccountBalances items={[]} testID="balances" />);

    expect(screen.queryByTestId("balances")).toBeNull();
  });
});
