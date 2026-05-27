import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { showToken } from "~/renderer/actions/settings";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";

export type UseHiddenBannerViewModelProps = Readonly<{
  currency: CryptoOrTokenCurrency;
}>;

export type HiddenBannerViewModel = Readonly<{
  isHidden: boolean;
  description: string;
  primaryActionLabel: string;
  onShowAsset: () => void;
}>;

export function useHiddenBannerViewModel({
  currency,
}: UseHiddenBannerViewModelProps): HiddenBannerViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector) ?? [];

  const currencyId = currency.id;
  const isHidden = blacklistedTokenIds.includes(currencyId);

  const onShowAsset = useCallback(() => {
    track("button_clicked", {
      button: "show_in_portfolio",
      currency: currencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    dispatch(showToken(currencyId));
  }, [dispatch, currencyId]);

  return useMemo(
    () => ({
      isHidden,
      description: t("assetDetails.hiddenBanner.description"),
      primaryActionLabel: t("assetDetails.hiddenBanner.showAsset"),
      onShowAsset,
    }),
    [isHidden, t, onShowAsset],
  );
}
