import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";

const MARKET_SEARCH_DEBOUNCE_MS = 300;

export type MarketSearch = {
  value: string;
  query: string;
  isActive: boolean;
  isDebouncing: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

const normalizeSearchValue = (value: string) => value.trim();

export function useMarketSearch(): MarketSearch {
  const [value, setValue] = useState("");
  const debouncedValue = useDebounce(value, MARKET_SEARCH_DEBOUNCE_MS);

  const normalizedValue = normalizeSearchValue(value);
  const isActive = normalizedValue.length > 0;
  const query = isActive ? normalizeSearchValue(debouncedValue) : "";
  const isDebouncing = isActive && query !== normalizedValue;

  const onClear = useCallback(() => {
    setValue("");
  }, []);

  return useMemo(
    () => ({
      value,
      query,
      isActive,
      isDebouncing,
      onChangeText: setValue,
      onClear,
    }),
    [isActive, isDebouncing, onClear, query, value],
  );
}
