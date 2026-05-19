import { useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";
import BigNumber from "bignumber.js";
import type { AssetDetailCurrencyProps } from "LLM/features/AssetDetail/types";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import {
  formatCurrencyUnit,
  formatCurrencyUnitFragment,
} from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { useInterestRatesByCurrencies } from "@ledgerhq/live-common/dada-client/hooks/useInterestRatesByCurrencies";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "~/context/hooks";
import { accountsByCryptoCurrencyScreenSelector } from "~/reducers/accounts";
import { counterValueCurrencySelector } from "~/reducers/settings";
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

export function useBalanceDetailsViewModel(currency: AssetDetailCurrencyProps) {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const { locale } = useLocale();
  const { t } = useTranslation();

  const accountsSelector = useMemo(
    () => (currency ? accountsByCryptoCurrencyScreenSelector(currency) : () => []),
    [currency],
  );
  const accountTuples = useSelector(accountsSelector, shallowEqual);

  const hasAccounts = accountTuples.length > 0;

  const { totalBalance, availableBalance, earnDeposit } = useMemo(() => {
    let total = new BigNumber(0);
    let spendable = new BigNumber(0);
    for (const tuple of accountTuples) {
      const acc = tuple.subAccount ?? tuple.account;
      total = total.plus(acc.balance);
      spendable = spendable.plus(acc.spendableBalance);
    }
    const deposit = total.minus(spendable);
    return {
      totalBalance: total,
      availableBalance: spendable,
      earnDeposit: deposit.isPositive() ? deposit : new BigNumber(0),
    };
  }, [accountTuples]);

  const unit = currency?.units?.[0];

  const formattedTotalBalance = useMemo(() => {
    if (!unit) return "";
    return formatCurrencyUnit(unit, totalBalance, { showCode: true });
  }, [unit, totalBalance]);

  const counterValueUnit = counterValueCurrency.units[0];

  const totalCounterValue = useCalculate({
    from: currency ?? counterValueCurrency,
    to: counterValueCurrency,
    value: totalBalance.toNumber(),
    disableRounding: true,
  });

  const counterValue = typeof totalCounterValue === "number" ? totalCounterValue : undefined;

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
        formattedAvailable: formatCurrencyUnit(unit, availableBalance, { showCode: true }),
        formattedDeposit: formatCurrencyUnit(unit, earnDeposit, { showCode: true }),
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
  }, [hasAccounts, hasStake, isStakeable, unit, availableBalance, earnDeposit, interestRate, t]);

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
