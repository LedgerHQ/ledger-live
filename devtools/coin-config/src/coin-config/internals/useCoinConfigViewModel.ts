import { useCallback, useMemo, useState } from "react";
import type { CoinConfigToolProps, KeyDisplayState, KeyFilter } from "../../types";
import { FILTERS, isKeyFilter, matchesFilter, matchesSearch } from "./filters";
import { valueTypeOf } from "./valueType";

export function useCoinConfigViewModel({
  keys,
  overrides,
  getResolvedValue,
  getDefaultValue,
}: CoinConfigToolProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<KeyFilter>("coins");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const selectFilter = useCallback((value: string) => {
    if (isKeyFilter(value)) setFilter(value);
  }, []);

  const filteredKeys = useMemo(
    () => keys.filter(key => matchesSearch(key, search) && matchesFilter(filter, key, overrides)),
    [keys, search, filter, overrides],
  );

  // Counts reflect totals across all keys, independent of the active search and filter.
  const counts = useMemo(() => {
    const acc: Record<KeyFilter, number> = { coins: 0, all: keys.length, overridden: 0 };
    for (const key of keys) {
      if (matchesFilter("coins", key, overrides)) acc.coins++;
      if (matchesFilter("overridden", key, overrides)) acc.overridden++;
    }
    return acc;
  }, [keys, overrides]);

  const filterOptions = useMemo(
    () => FILTERS.map(value => ({ value, count: counts[value] })),
    [counts],
  );

  const getKeyDisplayState = useCallback(
    (key: string): KeyDisplayState => {
      const resolved = getResolvedValue(key);
      return {
        key,
        resolved,
        defaultValue: getDefaultValue(key),
        valueType: valueTypeOf(resolved),
        isOverridden: Object.hasOwn(overrides, key),
      };
    },
    [getResolvedValue, getDefaultValue, overrides],
  );

  return {
    search,
    setSearch,
    filter,
    setFilter: selectFilter,
    filterOptions,
    filteredKeys,
    totalCount: keys.length,
    overrideCount: counts.overridden,
    getKeyDisplayState,
    selectedKey,
    selectKey: setSelectedKey,
    clearSelection: useCallback(() => setSelectedKey(null), []),
  };
}

export type CoinConfigViewModel = ReturnType<typeof useCoinConfigViewModel>;
