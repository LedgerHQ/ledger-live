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

const bitcoin = getCryptoCurrencyById("bitcoin");

function makeItem(overrides: Partial<DistributionItem> = {}): DistributionItem {
  return {
    currency: bitcoin,
    amount: 100000000,
    countervalue: 50000,
    distribution: 0.5,
    accounts: [],
    ...overrides,
  };
}

describe("AssetDistribution Row", () => {
  beforeEach(() => {
    mockedPrice.mockClear();
    mockedCounterValue.mockClear();
  });

  it("should render price and countervalue components", () => {
    render(<Row item={makeItem()} isVisible={false} isResponsiveLayout={false} />);

    expect(screen.getByTestId("asset-price")).toBeVisible();
    expect(screen.getByTestId("asset-countervalue")).toBeVisible();
    expect(mockedPrice).toHaveBeenCalledTimes(1);
    expect(mockedCounterValue).toHaveBeenCalledTimes(1);
  });

  it("should render percentage text and bar even when distribution is 0", () => {
    render(
      <Row
        item={makeItem({ distribution: 0, amount: 1, countervalue: 0 })}
        isVisible={false}
        isResponsiveLayout={false}
      />,
    );

    expect(screen.getByText("0%")).toBeVisible();
    expect(screen.getByTestId("asset-price")).toBeVisible();
    expect(screen.getByTestId("asset-countervalue")).toBeVisible();
  });

  it("should display the correct percentage for a given distribution", () => {
    render(
      <Row
        item={makeItem({ distribution: 0.4567 })}
        isVisible={false}
        isResponsiveLayout={false}
      />,
    );

    expect(screen.getByText("45.67%")).toBeVisible();
  });

  it("should render the currency name", () => {
    render(<Row item={makeItem()} isVisible={false} isResponsiveLayout={false} />);

    expect(screen.getByText("Bitcoin")).toBeVisible();
  });

  it("should pass currency and value props to CounterValue", () => {
    const item = makeItem({ amount: 200000000 });
    render(<Row item={item} isVisible={false} isResponsiveLayout={false} />);

    expect(mockedCounterValue).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: bitcoin,
        value: 200000000,
      }),
    );
  });

  it("should pass from prop to Price", () => {
    render(<Row item={makeItem()} isVisible={false} isResponsiveLayout={false} />);

    expect(mockedPrice).toHaveBeenCalledWith(
      expect.objectContaining({
        from: bitcoin,
      }),
    );
  });
});
