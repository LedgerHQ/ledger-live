import React, { useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getEnv } from "@ledgerhq/live-env";
import { track } from "~/renderer/analytics/segment";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

export type SearchProps = {
  setItemsToDisplay: React.Dispatch<React.SetStateAction<CryptoOrTokenCurrency[]>>;
  source: string;
  flow: string;
  items: CryptoOrTokenCurrency[];
};

export type SearchResult = {
  handleSearch: (query: string) => void;
  trackSearch: (current: string, previous: string) => void;
  searchQuery?: string;
};

const FUZE_OPTIONS = {
  includeScore: false,
  threshold: 0.1,
  keys: getEnv("CRYPTO_ASSET_SEARCH_KEYS"),
  shouldSort: false,
};

export const useSearch = ({
  setItemsToDisplay,
  items,
  source,
  flow,
}: SearchProps): SearchResult => {
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 2) {
      return setItemsToDisplay(items);
    }

    const results = fuse.search(query).map(result => result.item);

    setItemsToDisplay(results);
  };

  return {
    searchQuery,
    handleSearch,
    trackSearch,
  };
};
