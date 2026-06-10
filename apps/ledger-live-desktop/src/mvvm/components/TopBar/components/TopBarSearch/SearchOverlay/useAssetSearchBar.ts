import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useStocksSectionViewModel } from "LLD/features/Stocks/hooks/useStocksSectionViewModel";
import { useAssetSuggestionsViewModel } from "LLD/features/SearchAssets/hooks/useAssetSuggestionsViewModel";
import { SearchMode, SearchResults, SearchSuggestions } from "./types";

const EMPTY_RESULTS: SearchResults = { data: [], isLoading: false };

export const STOCKS_SUGGESTION_LIMIT = 20;
export const CRYPTOS_SUGGESTION_LIMIT = 3;
export const STABLECOINS_SUGGESTION_LIMIT = 2;

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
  const { cryptos, stablecoins } = useAssetSuggestionsViewModel({
    cryptosLimit: CRYPTOS_SUGGESTION_LIMIT,
    stablecoinsLimit: STABLECOINS_SUGGESTION_LIMIT,
  });

  const suggestions: SearchSuggestions = useMemo(
    () => ({ cryptos, stablecoins, stocks }),
    [cryptos, stablecoins, stocks],
  );
  const results = EMPTY_RESULTS;

  const mode: SearchMode = useMemo(() => {
    if (query.trim().length === 0) return "suggestions";
    if (results.isLoading || results.data.length > 0) return "results";
    return "noResults";
  }, [query, results]);

  return { query, onChangeQuery, clear, isOpen, open, close, mode, suggestions, results };
}
