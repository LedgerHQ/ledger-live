// The overlay only needs the provider to switch color scheme; the stubbed provider ignores it.
jest.mock("@ledgerhq/lumen-design-core", () => ({ ledgerLiveThemes: {} }));

import React from "react";
import { render, screen } from "@testing-library/react-native";
import { CardVisual } from "./CardVisual";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

describe("CardVisual (native)", () => {
  it("renders the view with the props it is given", () => {
    render(
      <CardVisual balance={100} formatCountervalue={formatCountervalue} balanceLabel="Balance" />,
    );

    expect(screen.getByTestId("card-visual")).toBeTruthy();
    expect(screen.getByText("Balance")).toBeTruthy();
  });
});
