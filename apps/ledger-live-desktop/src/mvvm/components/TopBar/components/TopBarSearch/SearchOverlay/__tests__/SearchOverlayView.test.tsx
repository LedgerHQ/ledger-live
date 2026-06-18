import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { SearchOverlay } from "..";
import { useAssetSearchBar } from "../useAssetSearchBar";
import { SearchMode, SearchResults, SearchSuggestions } from "../types";

jest.mock("../useAssetSearchBar");

// The shared VirtualList relies on layout measurements that jsdom does not provide, so we render a
// thin stand-in that maps items through `renderItem` and forwards the infinite-scroll callback.
jest.mock("LLD/components/VirtualList", () => {
  const ReactModule = require("react");
  return {
    VirtualList: ({
      items,
      renderItem,
      hasNextPage,
      onVisibleItemsScrollEnd,
    }: {
      items: unknown[];
      renderItem: (item: unknown) => unknown;
      hasNextPage?: boolean;
      onVisibleItemsScrollEnd?: () => void;
    }) => {
      ReactModule.useEffect(() => {
        if (hasNextPage) onVisibleItemsScrollEnd?.();
      }, [hasNextPage, onVisibleItemsScrollEnd]);
      return ReactModule.createElement(
        ReactModule.Fragment,
        null,
        items.map((item, index) =>
          ReactModule.createElement(ReactModule.Fragment, { key: index }, renderItem(item)),
        ),
      );
    },
  };
});

const mockedUseAssetSearchBar = jest.mocked(useAssetSearchBar);

const EMPTY_SECTION = { data: [], isLoading: false };
const EMPTY_SUGGESTIONS: SearchSuggestions = {
  cryptos: EMPTY_SECTION,
  stocks: EMPTY_SECTION,
};
const EMPTY_RESULTS: SearchResults = {
  data: [],
  isLoading: false,
  hasNextPage: false,
  isFetchingNextPage: false,
};

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
    mockSearchBar({
      mode: "results",
      query: "bit",
      results: { data: [], isLoading: true, hasNextPage: false, isFetchingNextPage: false },
    });

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
        hasNextPage: false,
        isFetchingNextPage: false,
      },
    });

    render(<SearchOverlay />);

    expect(screen.getByTestId("search-results-list")).toBeInTheDocument();
    expect(screen.getByTestId("search-result-item-btc")).toBeInTheDocument();
  });

  it("requests the next page when more results are available in `results` mode", async () => {
    const loadNext = jest.fn();
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
        hasNextPage: true,
        isFetchingNextPage: false,
        loadNext,
      },
    });

    render(<SearchOverlay />);

    await waitFor(() => expect(loadNext).toHaveBeenCalled());
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
