import React from "react";
import { render, screen } from "@testing-library/react";
import { balanceItem } from "../Balance";
import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: ({ value }: { value: BigNumber }) => (
    <span data-testid="counter-value">{value.toString()}</span>
  ),
}));

jest.mock("~/renderer/components/FormattedVal", () => ({
  __esModule: true,
  default: ({ val }: { val: BigNumber }) => (
    <span data-testid="formatted-val">{val.toString()}</span>
  ),
}));

const mockCurrency = getCryptoCurrencyById("bitcoin");

describe("balanceItem", () => {
  it("should render balance when balance is greater than 0", () => {
    const balanceUI = {
      currency: mockCurrency,
      balance: new BigNumber(100000000),
    };

    const result = balanceItem(balanceUI);

    render(<>{result}</>);

    expect(screen.getByTestId("counter-value")).toBeInTheDocument();
    expect(screen.getByTestId("formatted-val")).toBeInTheDocument();
    expect(screen.getByTestId("counter-value")).toHaveTextContent("100000000");
    expect(screen.getByTestId("formatted-val")).toHaveTextContent("100000000");
  });

  it("should return null when balance is 0", () => {
    const balanceUI = {
      currency: mockCurrency,
      balance: new BigNumber(0),
    };

    const result = balanceItem(balanceUI);

    expect(result).toBeNull();
  });
});
