import { useCallback } from "react";
import { type FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { BigNumber } from "bignumber.js";
import { useSelector } from "~/context/hooks";
import { useLocale } from "~/context/Locale";
import { discreetModeSelector } from "~/reducers/settings";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePortfolioBalanceForDisplay } from "LLM/hooks/usePortfolioBalanceForDisplay";

type Params = {
  hoveredValue?: number | null;
};

export type AnalyticsBalanceDisplayViewModel = {
  value: number;
  formatter: (value: number) => FormattedValue;
  discreet: boolean;
  isHovering: boolean;
  isLoading: boolean;
  isBalanceAvailable: boolean;
  shouldDisplayBalanceRefreshRework: boolean;
};

export function useAnalyticsBalanceDisplayViewModel({
  hoveredValue,
}: Params): AnalyticsBalanceDisplayViewModel {
  const { locale } = useLocale();
  const { displayedBalance, isLoading, isBalanceAvailable, unit } = usePortfolioBalanceForDisplay();
  const discreet = useSelector(discreetModeSelector);
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");

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
    shouldDisplayBalanceRefreshRework,
  };
}
