import { useCallback, useState } from "react";
import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "LLM/features/ModularDrawer/analytics";

export type SearchProps = {
  setSearchedValue?: (value: string) => void;
  defaultValue?: string;
  source: string;
  flow: string;
  assetsConfiguration?: EnhancedModularDrawerConfiguration["assets"];
  formatAssetConfig?: boolean;
  onPressIn?: () => void;
};

export type SearchResult = {
  handleSearch: (query: string) => void;
  handleDebouncedChange: (current: string, previous: string) => void;
  displayedValue: string | undefined;
};

export const useSearch = ({
  setSearchedValue,
  defaultValue,
  source,
  flow,
  assetsConfiguration,
  formatAssetConfig,
}: SearchProps): SearchResult => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const [displayedValue, setDisplayedValue] = useState<string | undefined>(defaultValue);

  const handleDebouncedChange = useCallback(
    (currentQuery: string, previousQuery: string) => {
      setSearchedValue?.(currentQuery);

      if (currentQuery === previousQuery) return;

      if (currentQuery.trim() === "" && previousQuery !== "") return;

      trackModularDrawerEvent(
        EVENTS_NAME.ASSET_SEARCHED,
        {
          flow,
          source,
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          searched_value: currentQuery,
        },
        {
          formatAssetConfig: Boolean(formatAssetConfig),
          assetsConfig: assetsConfiguration,
        },
      );
    },
    [
      trackModularDrawerEvent,
      flow,
      source,
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
