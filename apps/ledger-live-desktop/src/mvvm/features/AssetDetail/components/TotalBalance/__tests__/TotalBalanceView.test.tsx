import React from "react";
import { render, screen } from "tests/testSetup";
import { TotalBalanceView } from "../TotalBalanceView";

const baseProps = {
  totalBalanceLabel: "Total balance",
  fiatAriaLabel: "$ 1234.56",
  prefixSymbol: "$",
  suffixSymbol: null,
  hasDecimals: true,
  integerPart: "1234",
  decimalSeparator: ".",
  decimalPart: "56",
  cryptoBalance: <span>BTC</span>,
};

describe("TotalBalanceView", () => {
  it("renders formatted fiat balance with heading typography", () => {
    render(<TotalBalanceView {...baseProps} />);

    const fiatBalance = screen.getByTestId("asset-detail-fiat-balance");
    expect(fiatBalance).toHaveClass("heading-2-semi-bold");
    expect(fiatBalance).toHaveTextContent("$1234.56");
    expect(fiatBalance).toHaveAttribute("aria-label", "$ 1234.56");
  });

  it("renders formatter-provided discreet value", () => {
    render(
      <TotalBalanceView
        {...baseProps}
        fiatAriaLabel="Total balance"
        prefixSymbol={null}
        integerPart="***"
        hasDecimals={false}
      />,
    );

    const fiatBalance = screen.getByTestId("asset-detail-fiat-balance");
    expect(fiatBalance).toHaveTextContent("***");
    expect(fiatBalance).not.toHaveTextContent("1234");
    expect(fiatBalance).toHaveAttribute("aria-label", "Total balance");
  });
});
