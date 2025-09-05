import { ChangeEvent, useCallback, useState } from "react";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";

export type SearchProps = {
  setSearchedValue?: (value: string) => void;
  searchedValue?: string;
  source: string;
  flow: string;
};

export type SearchResult = {
  handleSearch: (queryOrEvent: string | ChangeEvent<HTMLInputElement>) => void;
  handleDebouncedChange: (current: string, previous: string) => void;
  displayedValue: string | undefined;
};

export const useSearch = ({
  setSearchedValue,
  searchedValue,
  source,
  flow,
}: SearchProps): SearchResult => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const [displayedValue, setDisplayedValue] = useState(searchedValue);

  const handleDebouncedChange = useCallback(
    (current: string, previous: string) => {
      const query = current;
      const prevQuery = previous;
      setSearchedValue?.(query);

      if (query === prevQuery) {
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
    },
    [trackModularDrawerEvent, flow, source, setSearchedValue],
  );

  const handleSearch = useCallback((queryOrEvent: string | ChangeEvent<HTMLInputElement>) => {
    const query = typeof queryOrEvent === "string" ? queryOrEvent : queryOrEvent.target.value;

    setDisplayedValue(query);
  }, []);

  return { handleDebouncedChange, handleSearch, displayedValue };
};
