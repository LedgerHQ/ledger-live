import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "LLD/features/ModularDrawer/analytics/types";

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
  handleDebouncedChange: (current: string, previous: string) => void;
  displayedValue: string | undefined;
};

const FUSE_OPTIONS = {
  includeScore: false,
  threshold: 0.1,
  keys: getEnv("CRYPTO_ASSET_SEARCH_KEYS"),
  shouldSort: false,
};

export const useSearch = ({
  setItemsToDisplay,
  setSearchedValue,
  defaultValue,
  items,
  source,
  flow,
}: SearchProps): SearchResult => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const [displayedValue, setDisplayedValue] = useState(defaultValue);

  const fuse = useMemo(() => new Fuse(items, FUSE_OPTIONS), [items]);

  const handleDebouncedChange = useCallback(
    (current: string, previous: string) => {
      const query = current;
      const prevQuery = previous;

      if (query === prevQuery) {
        return;
      }

      if (query.trim() === "" && prevQuery !== "") {
        setItemsToDisplay(items);
        return;
      }

      if (query.length < 2 && prevQuery.length < 2) {
        return;
      }

      trackModularDrawerEvent(
        "asset_searched",
        {
          flow,
          source,
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          searched_value: query,
        },
        {
          formatAssetConfig: true,
        },
      );

      const results =
        query.trim().length < 2
          ? items
          : fuse.search(query).map((result: Fuse.FuseResult<CryptoOrTokenCurrency>) => result.item);

      setItemsToDisplay(results);
      setSearchedValue?.(query);
    },
    [trackModularDrawerEvent, flow, source, items, fuse, setItemsToDisplay, setSearchedValue],
  );

  const handleSearch = useCallback((queryOrEvent: string | ChangeEvent<HTMLInputElement>) => {
    const query = typeof queryOrEvent === "string" ? queryOrEvent : queryOrEvent.target.value;

    setDisplayedValue(query);
  }, []);

  return { handleDebouncedChange, handleSearch, displayedValue };
};
