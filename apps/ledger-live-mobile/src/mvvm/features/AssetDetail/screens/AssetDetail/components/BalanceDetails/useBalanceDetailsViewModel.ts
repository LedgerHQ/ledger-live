import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { DistributionItem } from "@ledgerhq/types-live";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import { useInterestRatesByCurrencies } from "@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { NavigatorName, ScreenName } from "~/const";
import { track } from "~/analytics";
import { useLocale, useTranslation } from "~/context/Locale";
import type { BaseNavigation } from "~/components/RootNavigator/types/helpers";
import { useStake } from "LLM/hooks/useStake/useStake";
import { useTransferDrawerController } from "LLM/features/QuickActions/hooks/useTransferDrawerController";

type EarnState =
  | { type: "hidden" }
  | { type: "banner"; label: string }
  | { type: "staked"; formattedAvailable: string; formattedDeposit: string };

export function useBalanceDetailsViewModel(
  currency: AssetDetailCurrencyProps,
  distributionItem: DistributionItem | undefined,
) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const { locale } = useLocale();
  const { t } = useTranslation();

  const hasAccounts = (distributionItem?.accounts.length ?? 0) > 0;

  // `buildAssetDistribution` already aggregates `amount` and `countervalue`
  // across every network/sub-account of the asset (e.g. USDC on ETH + on
  // Base). We just consume the pre-computed values — same approach as
  // `apps/ledger-live-desktop/.../PortfolioSection/TotalBalance/useTotalBalanceViewModel.ts`.
  const totalBalance = useMemo(
    () => new BigNumber(distributionItem?.amount ?? 0),
    [distributionItem?.amount],
  );

  // Spendable is summed locally because the distribution item only exposes the
  // total amount, not the spendable balance per network.
  const { availableBalance, earnDeposit } = useMemo(() => {
    let spendable = new BigNumber(0);
    let total = new BigNumber(0);
    for (const acc of distributionItem?.accounts ?? []) {
      total = total.plus(acc.balance);
      spendable = spendable.plus(acc.spendableBalance);
    }
    const deposit = total.minus(spendable);
    return {
      availableBalance: spendable,
      earnDeposit: deposit.isPositive() ? deposit : new BigNumber(0),
    };
  }, [distributionItem?.accounts]);

  const unit = distributionItem?.currency.units?.[0] ?? currency?.units?.[0];

  const formattedTotalBalance = useMemo(() => {
    if (!unit) return "";
    return formatCurrencyUnit(unit, totalBalance, { showCode: true, discreet });
  }, [unit, totalBalance, discreet]);

  const counterValueUnit = counterValueCurrency.units[0];

  const counterValue = hasAccounts ? distributionItem?.countervalue ?? 0 : undefined;

  const counterValueFormatter = useCallback(
    (value: number): FormattedValue =>
      formatCurrencyUnitFragment(counterValueUnit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [counterValueUnit, locale],
  );

  const { getCanStakeCurrency } = useStake();
  const isStakeable = currency ? getCanStakeCurrency(currency.id) : false;
  const hasStake = earnDeposit.gt(0);

  const currencies = useMemo(() => (currency ? [currency] : []), [currency]);
  const interestRates = useInterestRatesByCurrencies(currencies);
  const interestRate = currency ? interestRates[currency.id] : undefined;

  const earnState: EarnState = useMemo(() => {
    if (!hasAccounts) return { type: "hidden" };

    if (isStakeable && hasStake && unit) {
      return {
        type: "staked",
        formattedAvailable: formatCurrencyUnit(unit, availableBalance, {
          showCode: true,
          discreet,
        }),
        formattedDeposit: formatCurrencyUnit(unit, earnDeposit, { showCode: true, discreet }),
      };
    }

    if (isStakeable) {
      const apyValue = interestRate?.value;
      const apyType = interestRate?.type ?? "APY";
      const label =
        apyValue && apyValue > 0
          ? t("assetDetail.balanceDetails.earnBanner", { apy: apyValue.toFixed(1), type: apyType })
          : t("assetDetail.balanceDetails.earnBannerGeneric");
      return { type: "banner", label };
    }

    return { type: "hidden" };
  }, [
    hasAccounts,
    hasStake,
    isStakeable,
    unit,
    availableBalance,
    earnDeposit,
    interestRate,
    t,
    discreet,
  ]);

  const { openDrawer } = useTransferDrawerController();
  const navigation = useNavigation<BaseNavigation>();

  const navigateToEarn = useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Earn,
      params: {
        screen: ScreenName.Earn,
        params: {
          intent: "deposit",
          ...(currency?.id && { currencyId: currency.id }),
        },
      },
    });
  }, [navigation, currency?.id]);

  const onTransferPress = useCallback(() => {
    track("button_clicked", {
      button: "transfer",
      currency: currency?.id,
      page: "Asset Detail",
    });
    openDrawer({ sourceScreenName: "Asset Detail" });
  }, [openDrawer, currency?.id]);

  const onEarnBannerPress = useCallback(() => {
    track("button_clicked", {
      button: "earn_banner",
      currency: currency?.id,
      page: "Asset Detail",
    });
    navigateToEarn();
  }, [currency?.id, navigateToEarn]);

  const onEarnDepositPress = useCallback(() => {
    track("button_clicked", {
      button: "earn_deposit",
      currency: currency?.id,
      page: "Asset Detail",
    });
    navigateToEarn();
  }, [currency?.id, navigateToEarn]);

  return {
    hasAccounts,
    discreet,
    counterValue,
    counterValueFormatter,
    formattedTotalBalance,
    earnState,
    onTransferPress,
    onEarnBannerPress,
    onEarnDepositPress,
  };
}

export type BalanceDetailsViewModelResult = ReturnType<typeof useBalanceDetailsViewModel>;
