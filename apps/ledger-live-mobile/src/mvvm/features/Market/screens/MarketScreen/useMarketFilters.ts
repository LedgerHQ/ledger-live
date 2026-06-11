import { useCallback, useMemo, useState } from "react";
import { track } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  selectMarketListSorting,
  selectMarketListTimeframe,
  setMarketListSorting,
  setMarketListTimeframe,
} from "~/reducers/market";
import type { MarketListFilterTimeframe, MarketListSorting } from "~/reducers/types";
import {
  getSupportedMarketListSorting,
  getSupportedMarketListTimeframe,
  isMarketListSortingSupported,
} from "./marketListFilters";

export type MarketFilterOption<TValue extends string> = {
  value: TValue;
  labelKey: string;
  disabled?: boolean;
};

export type MarketFilters = {
  isOpen: boolean;
  sorting: MarketListSorting;
  timeframe: MarketListFilterTimeframe;
  sortingOptions: MarketFilterOption<MarketListSorting>[];
  timeframeOptions: MarketFilterOption<MarketListFilterTimeframe>[];
  onOpen: () => void;
  onClose: () => void;
  onSelectSorting: (sorting: MarketListSorting) => void;
  onSelectTimeframe: (timeframe: MarketListFilterTimeframe) => void;
};

const ALL_NETWORKS_VALUE = "all";

const sortingOptions: MarketFilterOption<MarketListSorting>[] = [
  { value: "marketCap", labelKey: "market.assets.filters.sortingOptions.marketCap" },
  { value: "volume", labelKey: "market.assets.filters.sortingOptions.volume", disabled: true },
  { value: "gainers", labelKey: "market.assets.filters.sortingOptions.gainers" },
  { value: "losers", labelKey: "market.assets.filters.sortingOptions.losers" },
];

const timeframeOptions: MarketFilterOption<MarketListFilterTimeframe>[] = [
  { value: "1D", labelKey: "market.assets.filters.timeframeOptions.1D" },
  { value: "7D", labelKey: "market.assets.filters.timeframeOptions.7D" },
  { value: "30D", labelKey: "market.assets.filters.timeframeOptions.30D" },
  { value: "6M", labelKey: "market.assets.filters.timeframeOptions.6M" },
  { value: "1Y", labelKey: "market.assets.filters.timeframeOptions.1Y" },
];

function trackMarketListSort({
  sorting,
  timeframe,
  network,
}: {
  sorting: MarketListSorting;
  timeframe: MarketListFilterTimeframe;
  network: string | undefined;
}) {
  track("sort_market_list", {
    sorting,
    timeframe,
    network: network ?? ALL_NETWORKS_VALUE,
  });
}

export function useMarketFilters(): MarketFilters {
  const dispatch = useDispatch();
  const persistedSorting = useSelector(selectMarketListSorting) ?? "marketCap";
  const persistedTimeframe = useSelector(selectMarketListTimeframe) ?? "1D";
  const [isOpen, setIsOpen] = useState(false);

  const sorting = getSupportedMarketListSorting(persistedSorting);
  const timeframe = getSupportedMarketListTimeframe(persistedTimeframe);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onSelectSorting = useCallback(
    (nextSorting: MarketListSorting) => {
      if (!isMarketListSortingSupported(nextSorting)) {
        return;
      }

      dispatch(setMarketListSorting(nextSorting));
      trackMarketListSort({ sorting: nextSorting, timeframe, network: undefined });
    },
    [dispatch, timeframe],
  );

  const onSelectTimeframe = useCallback(
    (nextTimeframe: MarketListFilterTimeframe) => {
      dispatch(setMarketListTimeframe(nextTimeframe));
      trackMarketListSort({ sorting, timeframe: nextTimeframe, network: undefined });
    },
    [dispatch, sorting],
  );

  return useMemo(
    () => ({
      isOpen,
      sorting,
      timeframe,
      sortingOptions,
      timeframeOptions,
      onOpen,
      onClose,
      onSelectSorting,
      onSelectTimeframe,
    }),
    [isOpen, onClose, onOpen, onSelectSorting, onSelectTimeframe, sorting, timeframe],
  );
}
