import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { StockSuggestion } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { DefaultSections } from "..";
import { GLOBAL_SEARCH_TEST_IDS } from "../../../testIds";

const asset = (id: string, ticker: string, name: string): MarketAssetDisplayData => ({
  id,
  name,
  ticker,
  ledgerIds: [id],
  formattedMarketCap: "$1B",
  marketcapRank: 1,
  formattedPrice: "$1.00",
  priceChangePercentage: 1.5,
});

const stock = (id: string, ticker: string): StockSuggestion => ({
  id,
  name: ticker,
  ticker,
  navigationId: id,
  ledgerId: id,
});

const sections = {
  cryptos: [asset("bitcoin", "BTC", "Bitcoin")],
  stocks: [stock("aapl", "AAPL"), stock("tsla", "TSLA")],
};

const renderSections = (overrides = {}) => {
  const props = {
    sections,
    isLoading: false,
    hasError: false,
    onSeeAll: jest.fn(),
    onAssetPress: jest.fn(),
    onStockPress: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<DefaultSections {...props} />) };
};

describe("DefaultSections", () => {
  it("renders crypto rows and stock pills", () => {
    renderSections();

    expect(screen.getByTestId("global-search-asset-bitcoin")).toBeVisible();
    expect(screen.getByTestId("global-search-stock-aapl")).toBeVisible();
    expect(screen.getByTestId("global-search-stock-tsla")).toBeVisible();
  });

  it("calls onSeeAll with the category when a section header is pressed", async () => {
    const { props, user } = renderSections();

    await user.press(screen.getByTestId(`${GLOBAL_SEARCH_TEST_IDS.cryptosSection}-header`));
    await user.press(screen.getByTestId(`${GLOBAL_SEARCH_TEST_IDS.stocksSection}-header`));

    expect(props.onSeeAll).toHaveBeenNthCalledWith(1, "crypto");
    expect(props.onSeeAll).toHaveBeenNthCalledWith(2, "stocks");
  });

  it("calls onAssetPress and onStockPress on item taps", async () => {
    const { props, user } = renderSections();

    await user.press(screen.getByTestId("global-search-asset-bitcoin"));
    expect(props.onAssetPress).toHaveBeenCalledWith(sections.cryptos[0]);

    await user.press(screen.getByTestId("global-search-stock-aapl"));
    expect(props.onStockPress).toHaveBeenCalledWith(sections.stocks[0]);
  });

  it("shows skeletons while loading", () => {
    renderSections({
      isLoading: true,
      sections: { cryptos: [], stocks: [] },
    });

    expect(screen.getAllByTestId("global-search-asset-skeleton").length).toBeGreaterThan(0);
    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.cryptosSection)).toBeVisible();
  });

  it("shows the error state instead of the sections when the data fails", () => {
    renderSections({ hasError: true, sections: { cryptos: [], stocks: [] } });

    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.defaultsError)).toBeVisible();
    expect(screen.queryByTestId(GLOBAL_SEARCH_TEST_IDS.defaultSections)).toBeNull();
  });

  it("hides empty sections when not loading", () => {
    renderSections({
      isLoading: false,
      sections: { cryptos: [], stocks: [] },
    });

    expect(screen.queryByTestId(GLOBAL_SEARCH_TEST_IDS.cryptosSection)).toBeNull();
    expect(screen.queryByTestId(GLOBAL_SEARCH_TEST_IDS.stocksSection)).toBeNull();
  });
});
