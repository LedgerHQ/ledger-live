import { renderHook } from "tests/testSetup";
import { useSearchOverlayViewModel } from "../useSearchOverlayViewModel";
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
  isOpen,
  query = "",
}: {
  mode: SearchMode;
  isOpen: boolean;
  query?: string;
}) {
  mockedUseAssetSearchBar.mockReturnValue({
    query,
    onChangeQuery: jest.fn(),
    clear: jest.fn(),
    isOpen,
    open: jest.fn(),
    close: jest.fn(),
    mode,
    suggestions: EMPTY_SUGGESTIONS,
    results: EMPTY_RESULTS,
  });
}

describe("useSearchOverlayViewModel", () => {
  afterEach(() => jest.clearAllMocks());

  describe("displayed mode while closing", () => {
    it("exposes the live mode while the overlay is open", () => {
      mockSearchBar({ mode: "results", isOpen: true, query: "bit" });

      const { result } = renderHook(() => useSearchOverlayViewModel());

      expect(result.current.mode).toBe("results");
      expect(result.current.contextValue.mode).toBe("results");
    });

    it("keeps the last open mode while closing so the default list never flashes", () => {
      mockSearchBar({ mode: "results", isOpen: true, query: "bit" });
      const { result, rerender } = renderHook(() => useSearchOverlayViewModel());
      expect(result.current.mode).toBe("results");

      // close() clears the query, so the underlying mode flips to "suggestions" while the popover
      // is still animating closed. The view model must keep showing "results" (LIVE-32396).
      mockSearchBar({ mode: "suggestions", isOpen: false, query: "" });
      rerender();

      expect(result.current.mode).toBe("results");
      expect(result.current.contextValue.mode).toBe("results");
    });

    it("shows the suggestions again once the overlay reopens with an empty query", () => {
      mockSearchBar({ mode: "results", isOpen: true, query: "bit" });
      const { result, rerender } = renderHook(() => useSearchOverlayViewModel());

      mockSearchBar({ mode: "suggestions", isOpen: false, query: "" });
      rerender();
      expect(result.current.mode).toBe("results");

      mockSearchBar({ mode: "suggestions", isOpen: true, query: "" });
      rerender();
      expect(result.current.mode).toBe("suggestions");
    });
  });
});
