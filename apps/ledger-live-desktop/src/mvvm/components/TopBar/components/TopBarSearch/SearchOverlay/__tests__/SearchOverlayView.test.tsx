import React from "react";
import { render, screen } from "tests/testSetup";
import { SearchOverlay } from "..";
import { useAssetSearchBar } from "../useAssetSearchBar";
import { SearchMode, SearchResults, SearchSuggestions } from "../types";

jest.mock("../useAssetSearchBar");

const mockedUseAssetSearchBar = jest.mocked(useAssetSearchBar);

const EMPTY_SECTION = { data: [], isLoading: false };
const EMPTY_SUGGESTIONS: SearchSuggestions = {
  cryptos: EMPTY_SECTION,
  stocks: EMPTY_SECTION,
};
const EMPTY_RESULTS: SearchResults = { data: [], isLoading: false };

function mockSearchBar({
  mode,
  query = "",
  results = EMPTY_RESULTS,
}: {
  mode: SearchMode;
  query?: string;
  results?: SearchResults;
}) {
  mockedUseAssetSearchBar.mockReturnValue({
    query,
    onChangeQuery: jest.fn(),
    clear: jest.fn(),
    isOpen: true,
    open: jest.fn(),
    close: jest.fn(),
    mode,
    suggestions: EMPTY_SUGGESTIONS,
    results,
  });
}

describe("SearchOverlayView", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders the default suggestions view in `suggestions` mode", () => {
    mockSearchBar({ mode: "suggestions" });

    render(<SearchOverlay />);

    expect(screen.getByTestId("topbar-search-popover")).toBeInTheDocument();
    expect(screen.getByTestId("search-overlay-default")).toBeInTheDocument();
  });

  it("renders the general skeleton while the results are loading in `results` mode", () => {
    mockSearchBar({ mode: "results", query: "bit", results: { data: [], isLoading: true } });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-results-skeleton")).toBeInTheDocument();
  });

  it("renders the flat results list once loaded in `results` mode", () => {
    mockSearchBar({
      mode: "results",
      query: "bit",
      results: {
        data: [
          {
            id: "bitcoin",
            name: "Bitcoin",
            ticker: "BTC",
            ledgerIds: ["bitcoin"],
            price: 100,
            priceChangePercentage: { "24h": 1.2 },
          } as unknown as SearchResults["data"][number],
        ],
        isLoading: false,
      },
    });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-results-list")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-item-btc")).toBeInTheDocument();
  });

  it("renders the empty state in `noResults` mode", () => {
    mockSearchBar({ mode: "noResults", query: "zzzz" });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-empty-state")).toBeInTheDocument();
    expect(screen.getByText("No asset found")).toBeInTheDocument();
  });

  it("renders the error state in `error` mode", () => {
    mockSearchBar({ mode: "error", query: "bit" });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-error-state")).toBeInTheDocument();
    expect(screen.getByText("Connection failed")).toBeInTheDocument();
  });
});
