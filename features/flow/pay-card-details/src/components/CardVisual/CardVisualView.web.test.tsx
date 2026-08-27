import React from "react";
import { render, screen } from "@testing-library/react";
import { CardVisualView } from "./CardVisualView";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("CardVisualView (web)", () => {
  it("renders the card artwork with the balance caption and amount", () => {
    render(
      <CardVisualView
        balance={100}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
        isLoading={false}
      />,
    );

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
  });
});
