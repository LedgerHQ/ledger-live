import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";

export type SearchProps = {
  setItemsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  setSearchedValue?: (value: string) => void;
  assetsToDisplay: CryptoOrTokenCurrency[];
  originalAssets: CryptoOrTokenCurrency[];
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
  threshold: 0.3,
  keys: getEnv("CRYPTO_ASSET_SEARCH_KEYS"),
  shouldSort: false,
};

export const useSearch = ({
  setItemsToDisplay,
  setSearchedValue,
  assetsToDisplay: _assetsToDisplay,
  originalAssets,
  defaultValue,
  items: _items,
  source,
  flow,
}: SearchProps): SearchResult => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const [displayedValue, setDisplayedValue] = useState(defaultValue);

  const fuse = useMemo(() => new Fuse(originalAssets, FUSE_OPTIONS), [originalAssets]);

  const handleDebouncedChange = useCallback(
    (current: string, previous: string) => {
      const query = current;
      const prevQuery = previous;
      setSearchedValue?.(query);

      if (query === prevQuery) {
        return;
      }

      if (query.trim() === "" && prevQuery !== "") {
        setItemsToDisplay(originalAssets);
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

      const results = fuse
        .search(query)
        .map((result: Fuse.FuseResult<CryptoOrTokenCurrency>) => result.item);

      setItemsToDisplay(results);
    },
    [
      trackModularDrawerEvent,
      flow,
      source,
      originalAssets,
      fuse,
      setItemsToDisplay,
      setSearchedValue,
    ],
  );

  const handleSearch = useCallback((queryOrEvent: string | ChangeEvent<HTMLInputElement>) => {
    const query = typeof queryOrEvent === "string" ? queryOrEvent : queryOrEvent.target.value;

    setDisplayedValue(query);
  }, []);

  return { handleDebouncedChange, handleSearch, displayedValue };
};
