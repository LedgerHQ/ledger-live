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
  it("renders nothing until the native card visual ships", () => {
    render(
      <CardVisual balance={100} formatCountervalue={formatCountervalue} balanceLabel="Balance" />,
    );

    expect(screen.queryByTestId("card-visual")).toBeNull();
  });
});
