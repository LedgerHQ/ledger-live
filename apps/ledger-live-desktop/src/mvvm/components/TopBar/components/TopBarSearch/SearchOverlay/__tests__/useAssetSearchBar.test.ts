import { ChangeEvent } from "react";
import { renderHook, act } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { useAssetSearchBar } from "../useAssetSearchBar";

jest.mock("@ledgerhq/live-common/hooks/useDebounce", () => ({
  useDebounce: <T>(value: T) => value,
}));

jest.mock("LLD/features/Stocks/hooks/useStocksSectionViewModel", () => ({
  useStocksSectionViewModel: () => ({ data: [], isLoading: false, isError: false }),
}));

jest.mock("LLD/features/SearchAssets/hooks/useAssetSuggestionsViewModel", () => ({
  useAssetSuggestionsViewModel: () => ({ cryptos: { data: [], isLoading: false }, isError: false }),
}));

jest.mock("LLD/features/SearchAssets/hooks/useAssetSearchResultsViewModel", () => ({
  useAssetSearchResultsViewModel: () => ({ data: [], isLoading: false, isError: false }),
}));

// getCurrentTrackingPage reads a module-level navigation ref that leaks across the full suite.
// Mock it so the tracked page is deterministic here.
jest.mock("~/renderer/analytics/screenRefs", () => ({
  getCurrentTrackingPage: () => "",
  getPreviousTrackingPage: () => "",
}));

const mockedTrack = jest.mocked(track);

const changeQuery = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLInputElement>;

describe("useAssetSearchBar", () => {
  beforeEach(() => jest.clearAllMocks());

  it("tracks the debounced query once it reaches the minimum search length", () => {
    const { result } = renderHook(() => useAssetSearchBar());

    act(() => result.current.onChangeQuery(changeQuery("bit")));

    expect(mockedTrack).toHaveBeenCalledWith("Query global search", {
      search_query: "bit",
      page: "",
    });
  });

  it("does not track a query shorter than the minimum search length", () => {
    const { result } = renderHook(() => useAssetSearchBar());

    act(() => result.current.onChangeQuery(changeQuery("b")));

    expect(mockedTrack).not.toHaveBeenCalledWith("Query global search", expect.anything());
  });
});
