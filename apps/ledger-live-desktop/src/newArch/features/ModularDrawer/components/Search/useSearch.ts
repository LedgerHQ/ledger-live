import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type SearchProps = {
  setItemsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  setSearchedValue?: (value: string) => void;
  defaultValue?: string;
  source: string;
  flow: string;
  items: CryptoOrTokenCurrency[];
};

export type SearchResult = {
  handleSearch: (queryOrEvent: string | ChangeEvent<HTMLInputElement>) => void;
  trackSearch: (current: string, previous: string) => void;
  searchQuery: string;
};

const FUZE_OPTIONS = {
  includeScore: false,
  threshold: 0.1,
  keys: getEnv("CRYPTO_ASSET_SEARCH_KEYS"),
  shouldSort: false,
};

export const useSearch = ({
  setItemsToDisplay,
  setSearchedValue,
  defaultValue = "",
  items,
  source,
  flow,
}: SearchProps): SearchResult => {
  const [searchQuery, setSearchQuery] = useState(defaultValue);

  const fuse = useMemo(() => new Fuse(items, FUZE_OPTIONS), [items]);

  const trackSearch = useCallback(
    (current: string, previous: string) => {
      const query = current.trim();
      const prevQuery = previous.trim();

      if (query.length < 2 || query === prevQuery) return;

      track("asset_searched", { query, page: source, flow });
    },
    [source, flow],
  );

  const handleSearch = useCallback(
    (queryOrEvent: string | ChangeEvent<HTMLInputElement>) => {
      const query = typeof queryOrEvent === "string" ? queryOrEvent : queryOrEvent.target.value;

      setSearchQuery(query);
      setSearchedValue?.(query);

      if (query.trim().length < 2) {
        return setItemsToDisplay(items);
      }

      const results = fuse.search(query).map(result => result.item);

      setItemsToDisplay(results);
    },
    [fuse, items, setItemsToDisplay, setSearchedValue],
  );

  useEffect(() => {
    if (defaultValue && defaultValue.trim().length >= 2) {
      const results = fuse.search(defaultValue).map(result => result.item);
      setItemsToDisplay(results);
    } else {
      setItemsToDisplay(items);
    }
  }, [defaultValue, fuse, items, setItemsToDisplay]);

  return {
    searchQuery,
    handleSearch,
    trackSearch,
  };
};
