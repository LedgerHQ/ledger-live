import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { PORTFOLIO_RANGE_LABEL_KEY } from "../../../utils/portfolioRangeMapping";
import type { ChartSectionHeaderViewModel } from "./types";

type UseChartSectionHeaderViewModelProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  hoveredBalance: number | null;
  isLoading: boolean;
}>;

export function useChartSectionHeaderViewModel({
  balanceInfo,
  hoveredBalance,
  isLoading,
}: UseChartSectionHeaderViewModelProps): ChartSectionHeaderViewModel {
  const { t } = useTranslation();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const fiatUnit = counterValue.units[0];

  const balance = hoveredBalance ?? balanceInfo.totalBalance;

  const balanceFormatter = useCallback(
    (value: number) =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [fiatUnit, locale],
  );

  const percentageValue = (balanceInfo.valueChange.percentage ?? 0) * 100;

  const variationText = useMemo(() => {
    if (discreet) return "***";
    const mainUnitValue = new BigNumber(balanceInfo.valueChange.value)
      .shiftedBy(-fiatUnit.magnitude)
      .toNumber();
    return formatSignedFiatVariation(mainUnitValue, fiatUnit, locale);
  }, [balanceInfo.valueChange.value, discreet, fiatUnit, locale]);

  const rangeLabel = t(PORTFOLIO_RANGE_LABEL_KEY[selectedTimeRange]);

  return {
    balance,
    balanceAvailable: balanceInfo.isAvailable,
    isLoading,
    balanceFormatter,
    discreet,
    percentageValue,
    variationText,
    rangeLabel,
  };
}
