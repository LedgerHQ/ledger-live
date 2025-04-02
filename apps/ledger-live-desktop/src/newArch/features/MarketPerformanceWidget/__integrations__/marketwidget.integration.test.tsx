import React from "react";
import { render, screen, waitFor } from "tests/testSetup";

import { useMarketPerformanceWidget } from "../useMarketPerformanceWidget";
import { Order } from "../types";
import { MarketWidgetTest, FAKE_LIST } from "./shared";

jest.mock("../useMarketPerformanceWidget");
const mockedUseMarketPerformanceWidgetHook = useMarketPerformanceWidget as jest.Mock;

jest.mock("@tanstack/react-query", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@tanstack/react-query"),
  };
});

describe("MarketPerformance Widget", () => {
  it("should display error screen when Component appears", async () => {
    mockedUseMarketPerformanceWidgetHook.mockReturnValue({
      list: [],
      order: Order.asc,
      setOrder: jest.fn(),
      isLoading: false,
      hasError: true,
      range: "month",
      top: 0,
      enableNewFeature: true,
    });

    render(<MarketWidgetTest />, { initialRoute: `/` });

    expect(screen.getByTestId("error-container")).toBeVisible();
    expect(screen.getByText("1M trend")).toBeVisible();
    expect(screen.getByText("Sorry, we’re unable to load the trend")).toBeVisible();
  });
  it("should display V2 screen when FF new Feature is ON and go to market detail page of selected currency when clicking on it", async () => {
    mockedUseMarketPerformanceWidgetHook.mockReturnValue({
      list: FAKE_LIST,
      order: Order.asc,
      setOrder: jest.fn(),
      isLoading: false,
      hasError: false,
      range: "month",
      top: 0,
      enableNewFeature: true,
    });

    const { user } = render(<MarketWidgetTest />, { initialRoute: `/` });

    expect(screen.getAllByTestId(/market-performance-widget-row/i).length).toEqual(
      FAKE_LIST.length,
    );

    const btc = screen.getByTestId("market-performance-widget-row-1");
    expect(btc).toBeVisible();
    await user.click(btc);

    await waitFor(() => expect(screen.getByTestId("market-coin-page-container")).toBeVisible());

    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
  });
});
