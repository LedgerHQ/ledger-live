import React from "react";
import { render, screen } from "@testing-library/react";
import { CardVisualView } from "./CardVisualView";
import type { CardVisualViewProps, FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderCardVisual(props: Partial<CardVisualViewProps> = {}) {
  return render(
    <CardVisualView
      balance={100}
      formatCountervalue={formatCountervalue}
      balanceLabel="Balance"
      isLoading={false}
      isFrozen={false}
      {...props}
    />,
  );
}

describe("CardVisualView (web)", () => {
  it("renders the card face with the balance caption and amount", () => {
    renderCardVisual();

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
    expect(screen.queryByTestId("card-visual-frozen")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-artwork").parentElement).not.toHaveClass("opacity-50");
  });

  it("fades the card face behind the snow spot on a frozen card", () => {
    renderCardVisual({ isFrozen: true });

    expect(screen.getByTestId("card-visual-frozen")).toBeVisible();
    expect(screen.getByTestId("card-artwork").parentElement).toHaveClass("opacity-50");
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
  });
});
