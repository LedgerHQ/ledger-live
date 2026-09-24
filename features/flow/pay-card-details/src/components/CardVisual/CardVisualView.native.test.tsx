import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardVisualView } from "./CardVisualView.native";
import type { FormattedValue } from "../../types";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderView({
  isFrozen = false,
  fadeColor,
}: {
  isFrozen?: boolean;
  fadeColor?: string;
} = {}) {
  return render(
    <CardVisualView
      balance={100}
      formatCountervalue={formatCountervalue}
      balanceLabel="Balance"
      isLoading={false}
      isFrozen={isFrozen}
      fadeColor={fadeColor}
    />,
    { wrapper: I18nWrapper },
  );
}

describe("CardVisualView (native)", () => {
  it("renders the card face, the balance label and the amount", () => {
    renderView();

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
  });

  it("shows no fade when the host asks for none", () => {
    renderView();

    expect(screen.queryByTestId("card-visual-fade")).toBeNull();
  });

  it("uses the background color supplied by the card host for the fade", () => {
    renderView({ fadeColor: "#123456" });

    expect(screen.getByTestId("card-visual-fade").props.stops).toEqual([
      { color: "#123456", offset: 0, opacity: 0 },
      { color: "#123456", offset: 0.8156, opacity: 1 },
      { color: "#123456", offset: 1, opacity: 1 },
    ]);
  });

  it("does not show the frozen marker while the card is active", () => {
    renderView({ isFrozen: false });

    expect(screen.queryByTestId("card-visual-frozen")).toBeNull();
  });

  it("shows the frozen marker once the card is frozen", () => {
    renderView({ isFrozen: true });

    expect(screen.getByTestId("card-visual-frozen")).toBeVisible();
  });
});
