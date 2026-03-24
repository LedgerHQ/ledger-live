import { useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import BigNumber from "bignumber.js";
import { useLocale } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";

export interface ListItemViewModelResult {
  formattedBalance: string;
  formattedCounterValue: string | null;
  deltaText: string;
  deltaColor: "success" | "error" | "muted";
}

export const useListItemViewModel = (asset: Asset): ListItemViewModelResult => {
  const { currency } = asset;
  const balance = BigNumber(asset.amount);
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const discreet = useSelector(discreetModeSelector);
  const portfolio = usePortfolioForAccounts(asset.accounts);

  const formattedBalance = useMemo(
    () =>
      formatCurrencyUnit(currency.units[0], balance, {
        showCode: true,
        locale,
        discreet,
      }),
    [currency, balance, locale, discreet],
  );

  const countervalueRaw = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: balance.toNumber(),
    disableRounding: true,
  });

  const formattedCounterValue = useMemo(() => {
    if (asset.isPlaceholder && asset.placeholderPrice != null) {
      const unit = counterValueCurrency.units[0];
      const value = new BigNumber(asset.placeholderPrice).times(
        new BigNumber(10).pow(unit.magnitude),
      );
      return formatCurrencyUnit(unit, value, { locale, showCode: true, discreet });
    }
    return typeof countervalueRaw === "number"
      ? formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(countervalueRaw), {
          locale,
          showCode: true,
          discreet,
        })
      : null;
  }, [
    asset.isPlaceholder,
    asset.placeholderPrice,
    countervalueRaw,
    counterValueCurrency,
    locale,
    discreet,
  ]);

  let deltaText = "–";
  let deltaColor: ListItemViewModelResult["deltaColor"] = "muted";

  if (!asset.isPlaceholder) {
    const percentage = portfolio.countervalueChange.percentage;
    if (percentage != null) {
      const sign = percentage > 0 ? "+" : "";
      deltaText = `${sign}${(percentage * 100).toFixed(2)}%`;
      if (percentage > 0) {
        deltaColor = "success";
      } else if (percentage < 0) {
        deltaColor = "error";
      }
    }
  }

  return {
    formattedBalance,
    formattedCounterValue,
    deltaText,
    deltaColor,
  };
};
