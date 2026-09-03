import { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useFeature } from "@features/platform-feature-flags";
import { useAssetsData, useInterestRatesByCurrencies } from "@features/platform-aggregated-assets";
import { getInterestRateForAsset } from "@ledgerhq/live-common/modularDrawer/utils/getInterestRateForAsset";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { useDispatch } from "LLD/hooks/redux";
import { track, trackPage } from "~/renderer/analytics/segment";
import { closeSwapTransactionStatusDialog } from "../swapTransactionStatusDialog";

const TRANSLATION_PREFIX = "swap2.modals.transactionStatus.earnBanner";
const PAGE = "swapTransactionSuccess";
const FLOW = "swap";

type UseEarnBannerViewModelProps = Readonly<{
  sendCurrency?: CryptoOrTokenCurrency;
  receiveCurrency?: CryptoOrTokenCurrency;
  provider?: string;
}>;

export function useEarnBannerViewModel({
  sendCurrency,
  receiveCurrency,
  provider,
}: UseEarnBannerViewModelProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const feature = useFeature("ptxEarnTransactionSuccessBanner");
  const promotedToken = receiveCurrency?.ticker;
  const promotedTokens = useMemo(
    () => new Set(feature?.params?.promotedTokens ?? []),
    [feature?.params?.promotedTokens],
  );
  const isEligible = Boolean(
    feature?.enabled &&
    sendCurrency &&
    provider &&
    promotedToken &&
    promotedTokens.has(promotedToken),
  );

  useAssetsData({
    currencyIds: receiveCurrency ? [receiveCurrency.id] : undefined,
    areCurrenciesFiltered: true,
    product: "lld",
    version: __APP_VERSION__,
    skip: !isEligible,
  });

  const currencies = useMemo(() => (receiveCurrency ? [receiveCurrency] : []), [receiveCurrency]);
  const interestRates = useInterestRatesByCurrencies(currencies);
  const { interestRate, interestRatePercentageRounded } = useMemo(
    () =>
      receiveCurrency
        ? getInterestRateForAsset(receiveCurrency, interestRates)
        : { interestRate: undefined, interestRatePercentageRounded: 0 },
    [receiveCurrency, interestRates],
  );

  const isVisible = Boolean(isEligible && interestRate && interestRatePercentageRounded > 0);
  const title = isVisible
    ? t(`${TRANSLATION_PREFIX}.title`, {
        apy: interestRatePercentageRounded.toFixed(2),
        type: interestRate?.type,
      })
    : undefined;

  useEffect(() => {
    if (!isVisible) return;
    trackPage("swap earn promoter", null, {
      page: PAGE,
      flow: FLOW,
      sourceCurrency: sendCurrency?.ticker,
      targetCurrency: receiveCurrency?.ticker,
      targetCurrencyID: receiveCurrency?.id,
      provider,
      promotedToken,
    });
  }, [
    isVisible,
    promotedToken,
    provider,
    receiveCurrency?.id,
    receiveCurrency?.ticker,
    sendCurrency?.ticker,
  ]);

  const onExplore = useCallback(() => {
    track("button_clicked", {
      button: "earn_promoter",
      page: PAGE,
      flow: FLOW,
      sourceCurrency: sendCurrency?.ticker,
      targetCurrency: receiveCurrency?.ticker,
      targetCurrencyID: receiveCurrency?.id,
      provider,
      promotedToken,
    });
    dispatch(closeSwapTransactionStatusDialog());
    navigate("/earn");
  }, [
    dispatch,
    navigate,
    promotedToken,
    provider,
    receiveCurrency?.id,
    receiveCurrency?.ticker,
    sendCurrency?.ticker,
  ]);

  return {
    isVisible,
    title,
    description: t(`${TRANSLATION_PREFIX}.description`),
    buttonLabel: t(`${TRANSLATION_PREFIX}.button`),
    onExplore,
  };
}

export type EarnBannerViewModel = ReturnType<typeof useEarnBannerViewModel>;
