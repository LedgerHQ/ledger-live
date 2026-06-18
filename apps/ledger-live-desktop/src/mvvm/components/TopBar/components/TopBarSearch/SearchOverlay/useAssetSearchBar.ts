import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { useStocksSectionViewModel } from "LLD/features/Stocks/hooks/useStocksSectionViewModel";
import { useAssetSuggestionsViewModel } from "LLD/features/SearchAssets/hooks/useAssetSuggestionsViewModel";
import { useAssetSearchResultsViewModel } from "LLD/features/SearchAssets/hooks/useAssetSearchResultsViewModel";
import { SearchMode, SearchResults, SearchSuggestions } from "./types";
import { track } from "~/renderer/analytics/segment";
import { getCurrentTrackingPage } from "~/renderer/analytics/screenRefs";

export const STOCKS_SUGGESTION_LIMIT = 20;
export const CRYPTOS_SUGGESTION_LIMIT = 3;

const SEARCH_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

export function useAssetSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const onChangeQuery = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const clear = useCallback(() => setQuery(""), []);
  const open = useCallback(() => {
    setIsOpen(true);
    track("search_open", { page: getCurrentTrackingPage() });
  }, []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const trimmedQuery = query.trim();
  const debouncedQuery = useDebounce(trimmedQuery, SEARCH_DEBOUNCE_MS);
  const searchEnabled = debouncedQuery.length >= MIN_SEARCH_LENGTH;

  // Track the search once the debounce settles on a searchable query.
  useEffect(() => {
    if (debouncedQuery.length < MIN_SEARCH_LENGTH) return;
    track("Query global search", {
      search_query: debouncedQuery,
      page: getCurrentTrackingPage(),
    });
  }, [debouncedQuery]);

  // --- Default suggestions (top market cap + stocks), shown when the query is empty. ---
  const stocks = useStocksSectionViewModel({ limit: STOCKS_SUGGESTION_LIMIT });
  const { cryptos, isError: suggestionsAssetsError } = useAssetSuggestionsViewModel({
    cryptosLimit: CRYPTOS_SUGGESTION_LIMIT,
  });

  const suggestions: SearchSuggestions = useMemo(() => ({ cryptos, stocks }), [cryptos, stocks]);

  // --- Live search: a single flat list from the DADA assets search, driven by the debounced query.
  // Results are paginated (infinite scroll), so no client-side cap is applied. ---
  const search = useAssetSearchResultsViewModel({
    search: debouncedQuery,
    skip: !searchEnabled,
  });

  // While the debounce settles, keep the list in its loading (skeleton) state so the overlay never
  // flashes "no results" between keystrokes.
  const searchSettling = trimmedQuery.length > 0 && trimmedQuery !== debouncedQuery;

  const results: SearchResults = useMemo(
    () => ({
      data: search.data,
      isLoading: search.isLoading || searchSettling,
      loadNext: search.loadNext,
      hasNextPage: search.hasNextPage,
      isFetchingNextPage: search.isFetchingNextPage,
    }),
    [
      search.data,
      search.isLoading,
      search.loadNext,
      search.hasNextPage,
      search.isFetchingNextPage,
      searchSettling,
    ],
  );

  const suggestionsError = suggestionsAssetsError || stocks.isError;
  const searchError = searchEnabled && search.isError;

  const mode: SearchMode = useMemo(() => {
    if (trimmedQuery.length === 0) return suggestionsError ? "error" : "suggestions";
    if (searchError) return "error";
    if (results.isLoading) return "results";
    return results.data.length > 0 ? "results" : "noResults";
  }, [trimmedQuery, suggestionsError, searchError, results]);

  return { query, onChangeQuery, clear, isOpen, open, close, mode, suggestions, results };
}
