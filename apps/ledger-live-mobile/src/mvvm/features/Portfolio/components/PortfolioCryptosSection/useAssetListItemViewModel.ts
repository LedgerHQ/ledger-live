import { useMemo } from "react";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import BigNumber from "bignumber.js";
import { useLocale } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { usePortfolioForAccounts } from "~/hooks/portfolio";
import { counterValueCurrencySelector, discreetModeSelector } from "~/reducers/settings";
import { Asset } from "~/types/asset";

export interface AssetListItemViewModelResult {
  formattedBalance: string;
  formattedCounterValue: string | null;
  deltaText: string;
  deltaColor: "success" | "error" | "muted";
}

export const useAssetListItemViewModel = (asset: Asset): AssetListItemViewModelResult => {
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

  const formattedCounterValue = useMemo(
    () =>
      typeof countervalueRaw === "number"
        ? formatCurrencyUnit(counterValueCurrency.units[0], new BigNumber(countervalueRaw), {
            locale,
            showCode: true,
            discreet,
          })
        : null,
    [countervalueRaw, counterValueCurrency, locale, discreet],
  );

  const percentage = portfolio.countervalueChange.percentage;
  // default to – when percentage is null
  let deltaText = "–";
  let deltaColor: AssetListItemViewModelResult["deltaColor"] = "muted";

  if (percentage != null) {
    const sign = percentage > 0 ? "+" : "";
    deltaText = `${sign}${(percentage * 100).toFixed(2)}%`;
    if (percentage > 0) {
      deltaColor = "success";
    } else if (percentage < 0) {
      deltaColor = "error";
    } else {
      deltaColor = "muted";
    }
  }

  return {
    formattedBalance,
    formattedCounterValue,
    deltaText,
    deltaColor,
  };
};
