import { useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "../../../../analytics";

export type SearchProps = {
  setItemsToDisplay: (assets: CryptoOrTokenCurrency[]) => void;
  setSearchedValue?: (value: string) => void;
  assetsToDisplay: CryptoOrTokenCurrency[];
  originalAssets: CryptoOrTokenCurrency[];
  defaultValue?: string;
  source: string;
  flow: string;
  items: CryptoOrTokenCurrency[];
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  formatAssetConfig?: boolean;
};

export type SearchResult = {
  handleSearch: (query: string) => void;
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
  assetsToDisplay: _assetsToDisplay,
  originalAssets,
  defaultValue,
  items: _items,
  source,
  flow,
  assetsConfiguration,
  formatAssetConfig,
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
        EVENTS_NAME.ASSET_SEARCHED,
        {
          flow,
          source,
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          searched_value: query,
        },
        {
          formatAssetConfig: !!formatAssetConfig,
          assetsConfig: assetsConfiguration,
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
      assetsConfiguration,
      formatAssetConfig,
    ],
  );

  const handleSearch = useCallback((query: string) => {
    setDisplayedValue(query);
  }, []);

  return { handleDebouncedChange, handleSearch, displayedValue };
};
