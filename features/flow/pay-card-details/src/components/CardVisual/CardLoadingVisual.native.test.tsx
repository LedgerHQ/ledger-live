import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardLoadingVisual } from "./CardLoadingVisual.native";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderLoadingVisual() {
  return render(
    <CardLoadingVisual
      balance={0}
      formatCountervalue={formatCountervalue}
      balanceLabel="Balance"
      isLoading
    />,
    { wrapper: I18nWrapper },
  );
}

describe("CardLoadingVisual (Native)", () => {
  it("should show the card face with its balance label", () => {
    renderLoadingVisual();

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
  });

  it("should stand a skeleton in for each card action", () => {
    renderLoadingVisual();

    expect(screen.getByTestId("card-top-up-skeleton")).toBeVisible();
    expect(screen.getByTestId("card-details-skeleton")).toBeVisible();
  });
});
