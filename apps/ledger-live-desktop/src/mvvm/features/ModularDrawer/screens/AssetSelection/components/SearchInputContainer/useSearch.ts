import { ChangeEvent, useCallback } from "react";
import { useModularDrawerAnalytics } from "LLD/features/ModularDrawer/analytics/useModularDrawerAnalytics";
import { MODULAR_DRAWER_PAGE_NAME } from "LLD/features/ModularDrawer/analytics/modularDrawer.types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useSearchCommon } from "@ledgerhq/live-common/modularDrawer/hooks/useSearch";
import { modularDrawerSearchedSelector, setSearchedValue } from "~/renderer/reducers/modularDrawer";

export type SearchResult = {
  handleSearch: (queryOrEvent: string | ChangeEvent<HTMLInputElement>) => void;
  handleDebouncedChange: (current: string, previous: string) => void;
  displayedValue: string | undefined;
};

export const useSearch = (): SearchResult => {
  const dispatch = useDispatch();

  const searchedValue = useSelector(modularDrawerSearchedSelector);

  const { trackModularDrawerEvent } = useModularDrawerAnalytics();

  const onTrackSearch = useCallback(
    (query: string) => {
      trackModularDrawerEvent(
        "asset_searched",
        {
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          searched_value: query,
        },
        {
          formatAssetConfig: true,
        },
      );
    },
    [trackModularDrawerEvent],
  );

  const onPersistSearchValue = useCallback(
    (value: string) => {
      dispatch(setSearchedValue(value));
    },
    [dispatch],
  );

  const { handleSearch, handleDebouncedChange, displayedValue } = useSearchCommon({
    initialValue: searchedValue,
    onPersistSearchValue,
    onTrackSearch,
  });

  return { handleDebouncedChange, handleSearch, displayedValue };
};
