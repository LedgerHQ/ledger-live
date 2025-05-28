import React from "react";
import { render } from "@tests/test-renderer";
import { Card } from "../Card";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { mockCurrencyData } from "../../fixtures/currency";

jest.mock("~/logic/getWindowDimensions", () => () => ({
  width: 400,
  height: 800,
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

const mockSetRange = jest.fn();

describe("Card", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays the ticker, price, and variation", () => {
    const { getByText } = render(
      <Card
        data={mockCurrencyData}
        chartData={mockCurrencyData.chartData}
        range={KeysPriceChange.day}
        setRange={mockSetRange}
        height={100}
        loading={false}
        currentIndex={0}
      />,
    );
    expect(getByText("ETH")).toBeTruthy();
    expect(getByText(/188,350/)).toBeTruthy();
    expect(getByText("+1.50%")).toBeTruthy();
  });

  it("displays market values: 24h low/high, ATH, ATL, dates", () => {
    const { getByText } = render(
      <Card
        data={mockCurrencyData}
        chartData={mockCurrencyData.chartData}
        range={KeysPriceChange.day}
        setRange={mockSetRange}
        height={100}
        loading={false}
        currentIndex={0}
      />,
    );
    expect(getByText(/188,350/)).toBeTruthy();
    expect(getByText(/191,200/)).toBeTruthy();
    expect(getByText(/480,978/)).toBeTruthy();
    expect(getByText(/0.42/)).toBeTruthy();
    expect(getByText(/2021/)).toBeTruthy();
    expect(getByText(/2015/)).toBeTruthy();
  });

  it("triggers setRange when selecting another range via TabSelector", async () => {
    const { getByText, user } = render(
      <Card
        data={mockCurrencyData}
        chartData={mockCurrencyData.chartData}
        range={KeysPriceChange.day}
        setRange={mockSetRange}
        height={100}
        loading={false}
        currentIndex={0}
      />,
    );
    const tab = getByText("1W");
    await user.press(tab);
    expect(mockSetRange).toHaveBeenCalledWith(KeysPriceChange.week);
  });
});
