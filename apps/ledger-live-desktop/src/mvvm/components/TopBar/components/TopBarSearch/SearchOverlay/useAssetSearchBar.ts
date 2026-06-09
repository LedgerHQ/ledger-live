import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useStocksSectionViewModel } from "LLD/features/Stocks/hooks/useStocksSectionViewModel";
import { AssetSuggestionSection, SearchMode, SearchResults, SearchSuggestions } from "./types";

const EMPTY_SECTION: AssetSuggestionSection = { data: [], isLoading: false };
const EMPTY_RESULTS: SearchResults = { data: [], isLoading: false };

export const STOCKS_SUGGESTION_LIMIT = 20;

export function useAssetSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const onChangeQuery = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const clear = useCallback(() => setQuery(""), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const stocks = useStocksSectionViewModel({ limit: STOCKS_SUGGESTION_LIMIT });

  const suggestions: SearchSuggestions = useMemo(
    () => ({ cryptos: EMPTY_SECTION, stablecoins: EMPTY_SECTION, stocks }),
    [stocks],
  );
  const results = EMPTY_RESULTS;

  const mode: SearchMode = useMemo(() => {
    if (query.trim().length === 0) return "suggestions";
    if (results.isLoading || results.data.length > 0) return "results";
    return "noResults";
  }, [query, results]);

  return { query, onChangeQuery, clear, isOpen, open, close, mode, suggestions, results };
}
