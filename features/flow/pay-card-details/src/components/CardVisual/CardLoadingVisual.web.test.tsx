import React from "react";
import { render, screen } from "@testing-library/react";
import { CardLoadingVisual } from "./CardLoadingVisual.web";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("CardLoadingVisual (Web)", () => {
  it("should show the card face with its balance label", () => {
    render(
      <CardLoadingVisual
        balance={0}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
        isLoading
      />,
    );

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
  });
});
