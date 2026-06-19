import { type CSSProperties, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import counterValueFormatter from "@ledgerhq/live-common/market/utils/countervalueFormatter";
import { roundFiatPrice } from "@ledgerhq/live-currency-format";
import { setTrackingSource } from "~/renderer/analytics/TrackPage";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MarketCurrencyData, KeysPriceChange } from "@ledgerhq/live-common/market/utils/types";
import { getMarketOrAssetDetailPath } from "LLD/utils/marketAssetNavigation";
import { Page, useMarketActions } from "LLD/features/Market/hooks/useMarketActions";
import { getMarketPageCategoryAnalytics } from "LLD/features/Market/utils/marketPageAnalytics";
import { useGetStakeLabelLocaleBased } from "~/renderer/hooks/useGetStakeLabelLocaleBased";
import { track } from "~/renderer/analytics/segment";
import { getCurrentTrackingPage } from "~/renderer/analytics/screenRefs";
import { useSelector } from "LLD/hooks/redux";
import { marketCategorySelector } from "~/renderer/reducers/market";

type UseMarketRowViewModelProps = {
  size: number;
  start: number;
  currency: MarketCurrencyData;
  counterCurrency?: string;
  locale: string;
  range?: string;
  isStarred: boolean;
  toggleStar: (id: string, isStarred: boolean) => void;
};

export function useMarketRowViewModel({
  size,
  start,
  currency,
  counterCurrency,
  locale,
  range,
  isStarred,
  toggleStar,
}: UseMarketRowViewModelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { shouldDisplayAggregatedAssets } = useWalletFeaturesConfig("desktop");

  const selectedCategory = useSelector(marketCategorySelector);
  const category = getMarketPageCategoryAnalytics(selectedCategory);
  const {
    onBuy,
    onSell,
    onStake,
    onSwap,
    availableOnBuy,
    availableOnSell,
    availableOnSwap,
    availableOnStake,
  } = useMarketActions({ currency, page: Page.Market });

  const earnLabel = useGetStakeLabelLocaleBased();

  // Build the absolute-positioning style from primitive props so a row that stays
  // visible while scrolling keeps a stable `style` reference and `memo` holds.
  const style = useMemo<CSSProperties>(
    () => ({ height: `${size}px`, transform: `translateY(${start}px)` }),
    [size, start],
  );

  const onCurrencyClick = useCallback(() => {
    setTrackingSource("Page Market");
    track("button_clicked", {
      button: "Asset",
      currency: currency.id,
      page: getCurrentTrackingPage(),
      category,
    });
    navigate(getMarketOrAssetDetailPath(currency.id, shouldDisplayAggregatedAssets), {
      state: currency,
    });
  }, [category, currency, navigate, shouldDisplayAggregatedAssets]);

  const onToggleStar = useCallback(() => {
    toggleStar(currency.id, isStarred);
  }, [toggleStar, currency.id, isStarred]);

  // Defer the favourite toggle until the menu has closed, so the open menu never
  // shows the updated label/icon before disappearing (avoids a flicker).
  const pendingFavouriteToggle = useRef(false);
  const onFavouriteSelect = useCallback(() => {
    pendingFavouriteToggle.current = true;
  }, []);
  const onMenuOpenChange = useCallback(
    (open: boolean) => {
      if (!open && pendingFavouriteToggle.current) {
        pendingFavouriteToggle.current = false;
        onToggleStar();
      }
    },
    [onToggleStar],
  );

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const priceChangePercentage = currency.priceChangePercentage[range as KeysPriceChange];

  const formattedPrice = counterValueFormatter({
    value: roundFiatPrice(currency.price ?? 0),
    currency: counterCurrency,
    locale,
  });
  const formattedVolume = counterValueFormatter({
    shorten: true,
    currency: counterCurrency,
    value: currency.totalVolume,
    locale,
  });
  const formattedMarketCap = counterValueFormatter({
    shorten: true,
    currency: counterCurrency,
    value: currency.marketcap,
    locale,
  });

  return {
    t,
    style,
    currency,
    isStarred,
    onCurrencyClick,
    priceChangePercentage,
    formattedPrice,
    formattedVolume,
    formattedMarketCap,
    swapAction: { available: availableOnSwap, onClick: onSwap },
    // Single "Buy/Sell" entry: route to buy when buy is available, otherwise sell.
    buySellAction: {
      available: availableOnBuy || availableOnSell,
      onClick: availableOnBuy ? onBuy : onSell,
    },
    earnAction: { available: availableOnStake, onClick: onStake, label: earnLabel },
    onFavouriteSelect,
    onMenuOpenChange,
  };
}
