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

  const formattedBalance = useMemo(() => {
    const unit = currency.units?.[0];
    if (!unit) return "";
    return formatCurrencyUnit(unit, balance, {
      showCode: true,
      locale,
      discreet,
    });
  }, [currency, balance, locale, discreet]);

  const countervalueRaw = useCalculate({
    from: currency,
    to: counterValueCurrency,
    value: balance.toNumber(),
    disableRounding: true,
  });

  const formattedCounterValue = useMemo(() => {
    const counterValueUnit = counterValueCurrency.units?.[0];
    if (!counterValueUnit) return null;
    if (asset.isPlaceholder) {
      return formatCurrencyUnit(counterValueUnit, new BigNumber(0), {
        locale,
        showCode: true,
        discreet,
      });
    }
    return typeof countervalueRaw === "number"
      ? formatCurrencyUnit(counterValueUnit, new BigNumber(countervalueRaw), {
          locale,
          showCode: true,
          discreet,
        })
      : null;
  }, [asset.isPlaceholder, countervalueRaw, counterValueCurrency, locale, discreet]);

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
