import React from "react";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { createMockMarketCurrencyData } from "@ledgerhq/live-common/market/utils/fixtures";
import { KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { renderHook } from "tests/testSetup";
import { useMarketPriceSectionViewModel } from "../useMarketPriceSectionViewModel";
import { ScrubbedPriceContext, type ScrubSelection } from "../../../context/ScrubbedPriceContext";
import { useAssetDetailChartSeries } from "../../../hooks/useAssetDetailChartSeries";

jest.mock("../../../hooks/useAssetDetailChartSeries");

const mockedUseAssetDetailChartSeries = jest.mocked(useAssetDetailChartSeries);

const baseMarketCurrencyData = createMockMarketCurrencyData();

const marketData: AssetMarketData = {
  marketId: "bitcoin",
  isLoading: false,
  marketCurrencyData: createMockMarketCurrencyData({
    price: 100,
    priceChangePercentage: {
      ...baseMarketCurrencyData.priceChangePercentage,
      [KeysPriceChange.day]: 10,
    },
  }),
};

const makeScrubWrapper = (selection: ScrubSelection | undefined) =>
  function ScrubWrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      ScrubbedPriceContext.Provider,
      { value: { selection, setSelection: () => {} } },
      children,
    );
  };

describe("useMarketPriceSectionViewModel", () => {
  beforeEach(() => {
    mockedUseAssetDetailChartSeries.mockReturnValue({
      prices: [],
      timestamps: [],
      isLoading: false,
      isFetching: false,
      isError: false,
    });
  });

  it("derives all-time variation from chart endpoints instead of the 1y market change", () => {
    mockedUseAssetDetailChartSeries.mockReturnValue({
      prices: [10_000, 40_000],
      timestamps: [Date.UTC(2015, 0, 1), Date.UTC(2025, 0, 1)],
      isLoading: false,
      isFetching: false,
      isError: false,
    });

    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData: {
            ...marketData,
            marketCurrencyData: createMockMarketCurrencyData({
              price: 40_000,
              priceChangePercentage: {
                ...baseMarketCurrencyData.priceChangePercentage,
                [KeysPriceChange.year]: 30,
              },
            }),
          },
          isDistributionLoading: false,
          selectedRange: "all",
        }),
      { initialState: { settings: { counterValue: "USD", locale: "en-US" } } },
    );

    expect(result.current.percentageText).toBe("+300.00%");
    expect(result.current.variationText).toBe("+$30,000.00");
  });

  it("shows day change percentage and fiat variation in discreet mode", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      {
        initialState: {
          settings: { counterValue: "USD", locale: "en-US", discreetMode: true },
        },
      },
    );

    expect(result.current.percentageText).toBe("+10.00%");
    expect(result.current.variationText).toMatch(/^\+/);
    expect(result.current.variationText).not.toBe("—");
    expect(result.current.variationText).not.toBe("***");
  });

  it("uses the live price and no scrubbed date when not scrubbing", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      { initialState: { settings: { counterValue: "USD", locale: "en-US" } } },
    );

    expect(result.current.isScrubbing).toBe(false);
    expect(result.current.priceValue).toBe(100);
    expect(result.current.scrubbedDateLabel).toBeUndefined();
  });

  it("prefers the scrubbed price and exposes the formatted scrubbed date while scrubbing", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1y",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 250,
          timestamp: Date.UTC(2024, 0, 2),
          percentage: 1.5,
          variationFiat: 150,
        }),
      },
    );

    expect(result.current.isScrubbing).toBe(true);
    expect(result.current.priceValue).toBe(250);
    expect(result.current.scrubbedDateLabel).toContain("2024");
  });

  it("formats 1w scrubbed date as time + date", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1w",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 250,
          timestamp: Date.UTC(2024, 0, 2, 13, 45),
          percentage: 1.5,
          variationFiat: 150,
        }),
      },
    );

    expect(result.current.scrubbedDateLabel).toContain("2024");
    expect(result.current.scrubbedDateLabel).toContain(":");
  });

  it("formats 6m scrubbed date as time + date", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "6m",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 250,
          timestamp: Date.UTC(2024, 0, 2, 13, 45),
          percentage: 1.5,
          variationFiat: 150,
        }),
      },
    );

    expect(result.current.scrubbedDateLabel).toContain("2024");
    expect(result.current.scrubbedDateLabel).toContain(":");
  });

  it("formats 1d scrubbed date as time only", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 250,
          timestamp: Date.UTC(2024, 0, 2, 13, 45),
          percentage: 1.5,
          variationFiat: 150,
        }),
      },
    );

    expect(result.current.scrubbedDateLabel).toContain(":");
    expect(result.current.scrubbedDateLabel).not.toContain("2024");
  });

  it("formats 1y scrubbed date as date only", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1y",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 250,
          timestamp: Date.UTC(2024, 0, 2, 13, 45),
          percentage: 1.5,
          variationFiat: 150,
        }),
      },
    );

    expect(result.current.scrubbedDateLabel).toContain("2024");
    expect(result.current.scrubbedDateLabel).not.toContain(":");
  });

  it("treats a scrubbed price of 0 as scrubbing (not a missing value)", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 0,
          timestamp: Date.UTC(2024, 0, 2),
          percentage: -0.5,
          variationFiat: -50,
        }),
      },
    );

    expect(result.current.isScrubbing).toBe(true);
    expect(result.current.priceValue).toBe(0);
  });

  it("shows em dashes for variation when price data is missing", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData: {
            ...marketData,
            marketCurrencyData: createMockMarketCurrencyData({ price: undefined }),
          },
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      { initialState: { settings: { counterValue: "USD", locale: "en-US" } } },
    );

    expect(result.current.hasPriceData).toBe(false);
    expect(result.current.priceValue).toBeUndefined();
    expect(result.current.variationText).toBe("—");
    expect(result.current.percentageText).toBe("—");
  });

  it("uses scrubbed fiat variation and percentage while scrubbing", () => {
    const { result } = renderHook(
      () =>
        useMarketPriceSectionViewModel({
          ledgerId: "bitcoin",
          marketData,
          isDistributionLoading: false,
          selectedRange: "1d",
        }),
      {
        initialState: { settings: { counterValue: "USD", locale: "en-US" } },
        wrapper: makeScrubWrapper({
          price: 120,
          timestamp: Date.UTC(2024, 5, 1),
          percentage: 0.2,
          variationFiat: 20,
        }),
      },
    );

    expect(result.current.variationText).toMatch(/^\+/);
    expect(result.current.percentageText).toBe("+20.00%");
  });
});
