import { useCallback, useMemo } from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useInterestRatesByCurrencies } from "@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies";
import { getInterestRateForAsset } from "@ledgerhq/live-common/modularDrawer/utils/getInterestRateForAsset";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
} from "~/renderer/reducers/settings";
import { track } from "~/renderer/analytics/segment";
import { useStake } from "LLD/hooks/useStake";
import useStakeFlow from "~/renderer/screens/stake";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";
import { computeAvailableAndEarnDeposit } from "LLD/features/AssetDetail/utils/computeAvailableAndEarnDeposit";
import { computeFiatPortionsFromDistribution } from "LLD/features/AssetDetail/utils/computeFiatPortionsFromDistribution";
import { formatFiatBalanceForDisplay } from "LLD/features/AssetDetail/utils/formatFiatBalanceForDisplay";

export type StakingSectionState =
  | { type: "hidden" }
  | { type: "banner"; label: string }
  | { type: "staked"; formattedAvailable: string; formattedDeposit: string };

export function useStakingSectionViewModel(distributionItem: DistributionItem) {
  const { t } = useTranslation();
  const discreet = useSelector(discreetModeSelector);
  const locale = useSelector(localeSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const fiatUnit = fiatCurrency.units[0];
  const { currency, accounts } = distributionItem;
  const currencyId = currency.id;

  const { availableBalance, earnDeposit } = useMemo(
    () => computeAvailableAndEarnDeposit(accounts),
    [accounts],
  );

  const { getCanStakeCurrency } = useStake();
  const startStakeFlow = useStakeFlow();
  const isStakeable = getCanStakeCurrency(currencyId);
  const hasEarnDeposit = earnDeposit.gt(0);

  const interestRates = useInterestRatesByCurrencies([currency]);
  const { interestRate, interestRatePercentageRounded } = getInterestRateForAsset(
    currency,
    interestRates,
    [currency],
  );

  const state: StakingSectionState = useMemo(() => {
    if (!isStakeable) return { type: "hidden" };

    const buildBannerState = (label: string): Extract<StakingSectionState, { type: "banner" }> => ({
      type: "banner",
      label,
    });

    const buildStakedState = (): Extract<StakingSectionState, { type: "staked" }> => {
      const { availableFiat, earnDepositFiat } = computeFiatPortionsFromDistribution(
        distributionItem,
        availableBalance,
        earnDeposit,
      );
      return {
        type: "staked",
        formattedAvailable: formatFiatBalanceForDisplay(fiatUnit, availableFiat, {
          locale,
          discreet,
        }),
        formattedDeposit: formatFiatBalanceForDisplay(fiatUnit, earnDepositFiat, {
          locale,
          discreet,
        }),
      };
    };

    if (hasEarnDeposit) return buildStakedState();

    if (interestRate && interestRatePercentageRounded > 0) {
      return buildBannerState(
        t("assetDetails.staking.earnBanner", {
          apy: interestRatePercentageRounded.toFixed(1),
          type: interestRate.type,
        }),
      );
    }

    return buildBannerState(t("assetDetails.staking.earnBannerDefault"));
  }, [
    isStakeable,
    hasEarnDeposit,
    distributionItem,
    availableBalance,
    earnDeposit,
    fiatUnit,
    interestRate,
    interestRatePercentageRounded,
    t,
    discreet,
    locale,
  ]);

  const openStakeDrawer = useCallback(() => {
    startStakeFlow({
      currencies: [currencyId],
      source: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
  }, [currencyId, startStakeFlow]);

  const onEarnBannerPress = useCallback(() => {
    track("button_clicked", {
      button: "earn_banner",
      currency: currencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    openStakeDrawer();
  }, [currencyId, openStakeDrawer]);

  const onEarnDepositPress = useCallback(() => {
    track("button_clicked", {
      button: "earn_deposit",
      currency: currencyId,
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
    });
    openStakeDrawer();
  }, [currencyId, openStakeDrawer]);

  const onAvailableBalanceTooltipOpen = useCallback(
    (open: boolean) => {
      if (open) {
        track("button_clicked", {
          button: "market_stat_definition",
          currency: currencyId,
          type: "available_balance",
          page: ASSET_DETAIL_TRACKING_PAGE_NAME,
        });
      }
    },
    [currencyId],
  );

  return {
    state,
    availableBalanceTooltip: t("assetDetails.staking.availableBalanceTooltip"),
    availableBalanceLabel: t("assetDetails.staking.availableBalance"),
    earnDepositLabel: t("assetDetails.staking.earnDeposit"),
    earnBannerSubtitle: t("assetDetails.staking.earnBannerSubtitle"),
    earnBannerActionLabel: t("assetDetails.staking.earnBannerAction"),
    onEarnBannerPress,
    onEarnDepositPress,
    onAvailableBalanceTooltipOpen,
  };
}

export type StakingSectionViewModelResult = ReturnType<typeof useStakingSectionViewModel>;
