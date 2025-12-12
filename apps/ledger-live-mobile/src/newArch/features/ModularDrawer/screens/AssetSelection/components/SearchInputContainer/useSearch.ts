import { EnhancedModularDrawerConfiguration } from "@ledgerhq/live-common/wallet-api/ModularDrawer/types";
import {
  useModularDrawerAnalytics,
  EVENTS_NAME,
  MODULAR_DRAWER_PAGE_NAME,
} from "LLM/features/ModularDrawer/analytics";
import { useSelector, useDispatch } from "~/context/store";
import { modularDrawerSearchValueSelector, setSearchValue } from "~/reducers/modularDrawer";
import { useSearchCommon } from "@ledgerhq/live-common/modularDrawer/hooks/useSearch";
import { useCallback } from "react";

export type SearchProps = {
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
  source,
  flow,
  assetsConfiguration,
  formatAssetConfig,
}: SearchProps): SearchResult => {
  const { trackModularDrawerEvent } = useModularDrawerAnalytics();
  const searchValue = useSelector(modularDrawerSearchValueSelector);
  const dispatch = useDispatch();

  const onPersistSearchValue = useCallback(
    (value: string) => {
      dispatch(setSearchValue(value));
    },
    [dispatch],
  );

  const onTrackSearch = useCallback(
    (query: string) => {
      trackModularDrawerEvent(
        EVENTS_NAME.ASSET_SEARCHED,
        {
          flow,
          source,
          page: MODULAR_DRAWER_PAGE_NAME.MODULAR_ASSET_SELECTION,
          searched_value: query,
        },
        {
          formatAssetConfig: Boolean(formatAssetConfig),
          assetsConfig: assetsConfiguration,
        },
      );
    },
    [trackModularDrawerEvent, flow, source, assetsConfiguration, formatAssetConfig],
  );

  const { handleSearch, handleDebouncedChange, displayedValue } = useSearchCommon({
    initialValue: searchValue,
    onPersistSearchValue,
    onTrackSearch,
  });

  return { handleDebouncedChange, handleSearch, displayedValue };
};
