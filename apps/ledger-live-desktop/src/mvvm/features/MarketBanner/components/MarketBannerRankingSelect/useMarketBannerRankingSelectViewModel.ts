import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  MarketBannerRanking,
  selectMarketBannerRanking,
  setMarketBannerRanking,
} from "~/renderer/reducers/marketBanner";
import { starredMarketCoinsSelector } from "~/renderer/reducers/settings";

const RANKINGS: readonly MarketBannerRanking[] = ["trending", "gainers", "losers", "favorites"];

export type MarketBannerRankingSelectItem = {
  readonly value: MarketBannerRanking;
  readonly label: string;
  readonly disabled?: boolean;
};

export function useMarketBannerRankingSelectViewModel() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const ranking = useSelector(selectMarketBannerRanking);
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);

  const hasStarred = starredMarketCoins.length > 0;

  const items = useMemo<MarketBannerRankingSelectItem[]>(
    () =>
      RANKINGS.map(value => ({
        value,
        label: t(`marketBanner.ranking.${value}`),
        disabled: value === "favorites" && !hasStarred,
      })),
    [t, hasStarred],
  );

  const value = useMemo(() => items.find(item => item.value === ranking), [items, ranking]);
  const selectedLabel = value?.label;

  const onChange = useCallback(
    (option: MarketBannerRankingSelectItem | null) => {
      if (option == null) return;
      dispatch(setMarketBannerRanking(option.value));
    },
    [dispatch],
  );

  const onValueChange = useCallback(
    (selected: string | null) => {
      if (selected == null) return;
      onChange(items.find(option => option.value === selected) ?? null);
    },
    [items, onChange],
  );

  return {
    options: items,
    value,
    selectedValue: value?.value ?? null,
    selectedLabel,
    onChange,
    onValueChange,
  };
}
