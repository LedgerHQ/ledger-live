import React from "react";
import { render, screen } from "@testing-library/react";
import { StyleProvider } from "@features/platform-style";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import { PayCardBalanceFundedState } from "../PayCardBalanceFundedState.web";

const formatCountervalue = (value: number): FormattedValue =>
  ({
    integerPart: String(value),
    decimalPart: "00",
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "start",
  }) as unknown as FormattedValue;

describe("PayCardBalanceFundedState (Web)", () => {
  it("should render the funded balance", () => {
    render(
      <StyleProvider colorScheme="dark">
        <PayCardBalanceFundedState
          balance={1000}
          formatCountervalue={formatCountervalue}
          isLoading={false}
        />
      </StyleProvider>,
    );

    expect(screen.getByTestId("pay-card-balance-funded-state")).toBeVisible();
    expect(screen.getByTestId("pay-card-balance-amount")).toBeVisible();
  });
});
