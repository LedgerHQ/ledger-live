import React from "react";
import { render, screen } from "tests/testSetup";
import { CryptoBalanceTextView } from "./CryptoBalanceTextView";

describe("CryptoBalanceTextView", () => {
  it.each([
    {
      title: "leading currency and fractional digits",
      props: {
        prefixSymbol: null,
        suffixSymbol: "BTC",
        hasDecimals: true,
        integerPart: "0",
        decimalSeparator: ".",
        decimalPart: "01",
      },
      visible: ["BTC", "0", ".", "01"],
    },
    {
      title: "prefix symbol without decimals",
      props: {
        prefixSymbol: "€",
        suffixSymbol: null,
        hasDecimals: false,
        integerPart: "42",
        decimalSeparator: ",",
      },
      visible: ["€", "42"],
    },
  ])("$title", ({ props, visible }) => {
    render(<CryptoBalanceTextView {...props} />);

    const root = screen.getByTestId("asset-detail-crypto-balance");
    expect(root).toBeVisible();
    for (const text of visible) {
      expect(screen.getByText(text)).toBeVisible();
    }
  });

  it("does not render decimal separator when hasDecimals is false", () => {
    render(
      <CryptoBalanceTextView
        prefixSymbol={null}
        suffixSymbol={null}
        hasDecimals={false}
        integerPart="99"
        decimalSeparator="."
      />,
    );

    expect(screen.queryByText(".")).not.toBeInTheDocument();
    expect(screen.getByText("99")).toBeVisible();
  });
});
