// The overlay only needs the provider to switch color scheme; the stubbed provider ignores it.
jest.mock("@ledgerhq/lumen-design-core", () => ({ ledgerLiveThemes: {} }));

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardVisualView } from "./CardVisualView.native";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("CardVisualView (native)", () => {
  it("renders the card artwork with the balance caption and amount", () => {
    render(
      <CardVisualView
        balance={100}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
        isLoading={false}
      />,
    );

    expect(screen.getByTestId("card-visual")).toBeTruthy();
    expect(screen.getByTestId("card-artwork")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
    expect(screen.getByTestId("card-visual-amount")).toBeTruthy();
  });
});
