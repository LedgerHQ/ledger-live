import React from "react";
import { render, screen } from "tests/testSetup";
import { SearchOverlay } from "..";
import { useAssetSearchBar } from "../useAssetSearchBar";
import { SearchMode, SearchResults, SearchSuggestions } from "../types";

jest.mock("../useAssetSearchBar");

const mockedUseAssetSearchBar = jest.mocked(useAssetSearchBar);

const EMPTY_SECTION = { data: [], isLoading: false };
const SUGGESTIONS: SearchSuggestions = {
  cryptos: EMPTY_SECTION,
  stablecoins: EMPTY_SECTION,
  stocks: EMPTY_SECTION,
};

function mockSearchBar({
  mode,
  query = "",
  results = { data: [], isLoading: false },
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
    suggestions: SUGGESTIONS,
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

  it("renders the results list (skeletons while loading) in `results` mode", () => {
    mockSearchBar({ mode: "results", query: "bit", results: { data: [], isLoading: true } });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-results-skeleton")).toBeInTheDocument();
  });

  it("renders the empty state in `noResults` mode", () => {
    mockSearchBar({ mode: "noResults", query: "zzzz" });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-empty-state")).toBeInTheDocument();
    expect(screen.getByText('No results for "zzzz"')).toBeInTheDocument();
  });
});
