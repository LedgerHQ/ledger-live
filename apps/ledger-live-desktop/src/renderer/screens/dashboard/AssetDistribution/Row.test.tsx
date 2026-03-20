import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { render, screen } from "tests/testSetup";
import Row from "./Row";
import type { DistributionItem } from "@ledgerhq/types-live";

const mockedPrice = jest.fn((_props: unknown) => <div data-testid="asset-price" />);
const mockedCounterValue = jest.fn((_props: unknown) => <div data-testid="asset-countervalue" />);

jest.mock("~/renderer/components/Price", () => ({
  __esModule: true,
  default: (props: unknown) => mockedPrice(props),
}));

jest.mock("~/renderer/components/CounterValue", () => ({
  __esModule: true,
  default: (props: unknown) => mockedCounterValue(props),
}));

describe("AssetDistribution Row", () => {
  beforeEach(() => {
    mockedPrice.mockClear();
    mockedCounterValue.mockClear();
  });
  it("renders price and value components even when distribution is 0", () => {
    const currency = getCryptoCurrencyById("bitcoin");
    const item: DistributionItem = {
      currency,
      amount: 0.00000001,
      countervalue: 0,
      distribution: 0,
      accounts: [],
    };

    render(<Row item={item} isVisible={false} isResponsiveLayout={false} />);

    expect(screen.getByTestId("asset-price")).toBeInTheDocument();
    expect(screen.getByTestId("asset-countervalue")).toBeInTheDocument();
    expect(mockedPrice).toHaveBeenCalledTimes(1);
    expect(mockedCounterValue).toHaveBeenCalledTimes(1);
  });
});
