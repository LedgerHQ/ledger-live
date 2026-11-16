import { useCallback } from "react";
import { type FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import BigNumber from "bignumber.js";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { discreetModeSelector } from "~/reducers/settings";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";

/** A scoped balance shown instead of the Portfolio one, which is never overwritten. */
export type AnalyticsBalanceDisplayInput = Readonly<{
  amount: number;
  isLoading: boolean;
  isAvailable: boolean;
}>;

type Params = {
  hoveredValue?: number | null;
  balance?: AnalyticsBalanceDisplayInput;
};

export type AnalyticsBalanceDisplayViewModel = {
  value: number;
  formatter: (value: number) => FormattedValue;
  discreet: boolean;
  isHovering: boolean;
  isLoading: boolean;
  isBalanceAvailable: boolean;
};

export function useAnalyticsBalanceDisplayViewModel({
  hoveredValue,
  balance,
}: Params): AnalyticsBalanceDisplayViewModel {
  const { locale } = useLocale();
  const portfolioBalance = usePortfolioBalanceForDisplay();
  const { unit } = portfolioBalance;
  const displayedBalance = balance ? balance.amount : portfolioBalance.displayedBalance;
  const isLoading = balance ? balance.isLoading : portfolioBalance.isLoading;
  const isBalanceAvailable = balance ? balance.isAvailable : portfolioBalance.isBalanceAvailable;
  const discreet = useSelector(discreetModeSelector);

  const formatter = useCallback(
    (val: number): FormattedValue =>
      formatCurrencyUnitFragment(unit, new BigNumber(val), {
        locale,
        showCode: true,
      }),
    [unit, locale],
  );

  const isHovering = hoveredValue != null;
  const value = isHovering ? hoveredValue : displayedBalance;

  return {
    value,
    formatter,
    discreet,
    isHovering,
    isLoading,
    isBalanceAvailable,
  };
}
