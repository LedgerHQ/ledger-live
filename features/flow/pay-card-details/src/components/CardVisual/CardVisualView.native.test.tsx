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
  it("renders nothing until the native card visual ships", () => {
    render(
      <CardVisualView
        balance={100}
        formatCountervalue={formatCountervalue}
        balanceLabel="Balance"
        isLoading={false}
      />,
    );

    expect(screen.queryByTestId("card-visual")).toBeNull();
  });
});
