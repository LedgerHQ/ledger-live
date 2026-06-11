import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { SearchResults } from "..";
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

const results = [asset("bitcoin", "BTC", "Bitcoin"), asset("ethereum", "ETH", "Ethereum")];

const renderResults = (overrides = {}) => {
  const props = {
    results,
    isLoading: false,
    hasNoResults: false,
    onAssetPress: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<SearchResults {...props} />) };
};

describe("SearchResults", () => {
  it("renders a market row per result with the bottom fade gradient", () => {
    renderResults();

    expect(screen.getByTestId("marketItem-bitcoin")).toBeVisible();
    expect(screen.getByTestId("marketItem-ethereum")).toBeVisible();
    expect(screen.getByTestId("bottom-fade-gradient")).toBeVisible();
  });

  it("shows three skeletons while loading", () => {
    renderResults({ isLoading: true, results: [] });

    expect(screen.getAllByTestId(GLOBAL_SEARCH_TEST_IDS.searchSkeleton)).toHaveLength(3);
    expect(screen.queryByTestId("marketItem-bitcoin")).toBeNull();
  });

  it("shows the empty state when there are no results", () => {
    renderResults({ hasNoResults: true, results: [] });

    expect(screen.getByTestId(GLOBAL_SEARCH_TEST_IDS.searchEmptyState)).toBeVisible();
    expect(screen.queryByTestId(GLOBAL_SEARCH_TEST_IDS.searchResults)).toBeNull();
  });

  it("calls onAssetPress when a row is tapped", async () => {
    const { props, user } = renderResults();

    await user.press(screen.getByTestId("marketItem-bitcoin"));

    expect(props.onAssetPress).toHaveBeenCalledWith(results[0]);
  });
});
