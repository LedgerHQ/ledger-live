import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { PayCardBalanceView } from "../PayCardBalanceView.web";
import type { PayCardBalanceViewProps } from "../types";

const labels = {
  emptyTitle: "Pay and get paid",
  emptyDescription: "Start by depositing stablecoin to your wallet",
};

const formatCountervalue = (value: number): FormattedValue =>
  ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }) as unknown as FormattedValue;

function renderView(props: PayCardBalanceViewProps) {
  return render(
    <StyleProvider colorScheme="dark">
      <PayCardBalanceView {...props} />
    </StyleProvider>,
  );
}

describe("PayCardBalanceView (Web)", () => {
  it("should render the empty title and description when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.getByText("Pay and get paid")).toBeVisible();
    expect(screen.getByText("Start by depositing stablecoin to your wallet")).toBeVisible();
  });

  it("should not render a balance when empty", () => {
    renderView({ displayMode: "empty", labels });

    expect(screen.queryByTestId("pay-card-balance-funded-state")).not.toBeInTheDocument();
  });

  it("should render the funded balance when funded", () => {
    renderView({
      displayMode: "funded",
      balance: 1000,
      formatCountervalue,
      filter: "all",
      isLoading: false,
    });

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.queryByTestId("pay-card-balance-empty-state")).not.toBeInTheDocument();
  });
});
