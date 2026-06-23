import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import {
  addStarredMarketCoins,
  blacklistToken,
  removeStarredMarketCoins,
  showToken,
} from "~/actions/settings";
import { blacklistedTokenIdsSelector, starredMarketCoinsSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import { useTranslation } from "~/context/Locale";

type Params = Readonly<{
  currency: AssetDetailCurrencyProps;
  currencyId: string;
  marketId?: string;
}>;

export function useAssetCoinOptionsViewModel({ currency, currencyId, marketId }: Params) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { tryTriggerPushNotificationDrawerAfterAction } = useNotifications();

  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);

  const [isCoinOptionsSheetOpen, setCoinOptionsSheetOpen] = useState(false);

  const starKey = marketId ?? currencyId;
  const isHidden = !!currency && blacklistedTokenIds.includes(currency.id);
  const isStarred = starredMarketCoins.includes(starKey);

  const blacklistedTokenIdsSet = useMemo(() => new Set(blacklistedTokenIds), [blacklistedTokenIds]);

  const openCoinOptions = useCallback(() => setCoinOptionsSheetOpen(true), []);
  const closeCoinOptions = useCallback(() => setCoinOptionsSheetOpen(false), []);

  const trailingAccessibilityLabel = t("assetDetail.coinOptions.openMenuA11yLabel");

  const onToggleFavourite = useCallback(() => {
    const nextStarred = !isStarred;

    track("button_clicked", {
      button: "favourite",
      currency: currency?.id ?? currencyId,
      page: "Asset Detail",
      is_favourite: nextStarred,
    });

    if (nextStarred) {
      if (!starredMarketCoins.includes(starKey)) {
        dispatch(addStarredMarketCoins(starKey));
      }
      tryTriggerPushNotificationDrawerAfterAction("add_favorite_coin");
    } else if (starredMarketCoins.includes(starKey)) {
      dispatch(removeStarredMarketCoins(starKey));
    }
    closeCoinOptions();
  }, [
    currency,
    currencyId,
    isStarred,
    starKey,
    dispatch,
    starredMarketCoins,
    tryTriggerPushNotificationDrawerAfterAction,
    closeCoinOptions,
  ]);

  const onShowAsset = useCallback(() => {
    if (!currency) return;
    dispatch(showToken(currency.id));
  }, [currency, dispatch]);

  const onToggleHideFromPortfolio = useCallback(() => {
    if (!currency) return;

    const nextHidden = !isHidden;

    track("button_clicked", {
      button: "hide_asset",
      currency: currency.id,
      page: "Asset Detail",
      is_hidden: nextHidden,
    });

    if (nextHidden) {
      if (!blacklistedTokenIdsSet.has(currency.id)) {
        dispatch(blacklistToken(currency.id));
      }
    } else {
      onShowAsset();
    }
    closeCoinOptions();
  }, [currency, isHidden, blacklistedTokenIdsSet, dispatch, closeCoinOptions, onShowAsset]);

  return {
    isCoinOptionsSheetOpen,
    openCoinOptions,
    closeCoinOptions,
    trailingAccessibilityLabel,
    isHidden,
    isStarred,
    onToggleFavourite,
    onToggleHideFromPortfolio,
    onShowAsset,
  };
}

export type AssetCoinOptionsViewModel = ReturnType<typeof useAssetCoinOptionsViewModel>;
