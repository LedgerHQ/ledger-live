import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  addStarredMarketCoins,
  blacklistToken,
  removeStarredMarketCoins,
  showToken,
} from "~/renderer/actions/settings";
import {
  blacklistedTokenIdsSelector,
  starredMarketCoinsSelector,
} from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";

export type UseOptionsMenuViewModelProps = Readonly<{
  distributionItem?: DistributionItem;
  marketData: AssetMarketData;
  currency: CryptoOrTokenCurrency;
}>;

export type OptionsMenuViewModel = Readonly<{
  showMenu: boolean;
  optionsAriaLabel: string;
  addFavouriteLabel: string;
  removeFavouriteLabel: string;
  hideFromPortfolioLabel: string;
  showInPortfolioLabel: string;
  isStarred: boolean;
  isStarEnabled: boolean;
  isHideFromPortfolioEnabled: boolean;
  isHiddenFromPortfolio: boolean;
  onToggleStar: () => void;
  onHideFromPortfolio: () => void;
  onShowInPortfolio: () => void;
}>;

export function useOptionsMenuViewModel({
  distributionItem,
  marketData,
  currency,
}: UseOptionsMenuViewModelProps): OptionsMenuViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const starredMarketCoins = useSelector(starredMarketCoinsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector) ?? [];

  const { marketId } = marketData;

  const starMarketId = useMemo(
    () => marketId ?? distributionItem?.marketId ?? distributionItem?.slug,
    [marketId, distributionItem?.marketId, distributionItem?.slug],
  );

  const portfolioCurrencyId = currency.id;

  const isHiddenFromPortfolio = blacklistedTokenIds.includes(portfolioCurrencyId);

  const isStarEnabled = Boolean(starMarketId);
  const isHideFromPortfolioEnabled = Boolean(distributionItem);
  const showMenu = isStarEnabled || isHideFromPortfolioEnabled;

  const starredList = starredMarketCoins ?? [];
  const isStarred = Boolean(starMarketId && starredList.includes(starMarketId));

  const onToggleStar = useCallback(() => {
    if (!starMarketId) return;
    const nextStarred = !isStarred;
    track("button_clicked", {
      button: "favourite",
      currency: portfolioCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      is_favourite: nextStarred,
    });
    dispatch(
      isStarred ? removeStarredMarketCoins(starMarketId) : addStarredMarketCoins(starMarketId),
    );
  }, [dispatch, isStarred, portfolioCurrencyId, starMarketId]);

  const onHideFromPortfolio = useCallback(() => {
    track("button_clicked", {
      button: "hide_asset",
      currency: portfolioCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      is_hidden: true,
    });
    dispatch(blacklistToken(portfolioCurrencyId));
  }, [dispatch, portfolioCurrencyId]);

  const onShowInPortfolio = useCallback(() => {
    track("button_clicked", {
      button: "hide_asset",
      currency: portfolioCurrencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      is_hidden: false,
    });
    dispatch(showToken(portfolioCurrencyId));
  }, [dispatch, portfolioCurrencyId]);

  return useMemo(
    () => ({
      showMenu,
      optionsAriaLabel: t("assetDetails.header.optionsMenu"),
      addFavouriteLabel: t("assetDetails.header.addFavourite"),
      removeFavouriteLabel: t("assetDetails.header.removeFavourite"),
      hideFromPortfolioLabel: t("assetDetails.header.hideFromPortfolio"),
      showInPortfolioLabel: t("assetDetails.header.showInPortfolio"),
      isStarred,
      isStarEnabled,
      isHideFromPortfolioEnabled,
      isHiddenFromPortfolio,
      onToggleStar,
      onHideFromPortfolio,
      onShowInPortfolio,
    }),
    [
      showMenu,
      t,
      isStarred,
      isStarEnabled,
      isHideFromPortfolioEnabled,
      isHiddenFromPortfolio,
      onToggleStar,
      onHideFromPortfolio,
      onShowInPortfolio,
    ],
  );
}
