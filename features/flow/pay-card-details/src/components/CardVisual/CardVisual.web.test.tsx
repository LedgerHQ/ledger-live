import React from "react";
import { render, screen } from "@testing-library/react";
import { CardVisual } from "./CardVisual";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("CardVisual (web)", () => {
  it("renders the card artwork with the balance caption and amount", () => {
    render(
      <CardVisual balance={100} formatCountervalue={formatCountervalue} balanceLabel="Balance" />,
    );

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
  });
});
