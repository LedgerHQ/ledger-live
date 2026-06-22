import { useCallback, useMemo, useState } from "react";
import { track } from "~/analytics";
import { useDispatch, useSelector } from "~/context/hooks";
import { selectMarketBannerRanking, setMarketBannerRanking } from "~/reducers/marketBanner";
import { starredMarketCoinsSelector } from "~/reducers/settings";
import type { MarketBannerRanking } from "~/reducers/types";
import { MARKET_BANNER_FILTER_LABEL_KEYS, PAGE_NAME, BANNER_NAME } from "../constants";

export type MarketBannerFilterOption = {
  value: MarketBannerRanking;
  labelKey: string;
  disabled?: boolean;
  descriptionKey?: string;
};

export type MarketBannerFilterController = {
  filter: MarketBannerRanking;
  isOpen: boolean;
  options: MarketBannerFilterOption[];
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: MarketBannerRanking) => void;
};

export function useMarketBannerFilter(): MarketBannerFilterController {
  const dispatch = useDispatch();
  const filter = useSelector(selectMarketBannerRanking);
  const hasStarredAssets = useSelector(starredMarketCoinsSelector).length > 0;
  const [isOpen, setIsOpen] = useState(false);

  const options = useMemo<MarketBannerFilterOption[]>(
    () => [
      { value: "trending", labelKey: MARKET_BANNER_FILTER_LABEL_KEYS.trending },
      { value: "gainers", labelKey: MARKET_BANNER_FILTER_LABEL_KEYS.gainers },
      { value: "losers", labelKey: MARKET_BANNER_FILTER_LABEL_KEYS.losers },
      {
        value: "favorites",
        labelKey: MARKET_BANNER_FILTER_LABEL_KEYS.favorites,
        disabled: !hasStarredAssets,
        descriptionKey: hasStarredAssets ? undefined : "marketBanner.filter.noFavorites",
      },
    ],
    [hasStarredAssets],
  );

  const onOpen = useCallback(() => {
    track("button_clicked", {
      button: "Market Banner Filter",
      page: PAGE_NAME,
      banner: BANNER_NAME,
    });
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onSelect = useCallback(
    (value: MarketBannerRanking) => {
      setIsOpen(false);
      if (value === filter) return;

      dispatch(setMarketBannerRanking(value));
      track("change_sort_market_banner", { sort: value });
    },
    [dispatch, filter],
  );

  return useMemo(
    () => ({ filter, isOpen, options, onOpen, onClose, onSelect }),
    [filter, isOpen, options, onOpen, onClose, onSelect],
  );
}
