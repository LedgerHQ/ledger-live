import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { formatSignedFiatVariation } from "@ledgerhq/live-currency-format";
import type { PortfolioBalanceInfo } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { usePortfolioBalanceDisplayState } from "LLD/hooks/usePortfolioBalanceDisplayState";
import { useTrendViewModel } from "LLD/features/Portfolio/hooks/useTrendViewModel";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import type { ChartSectionHeaderViewModel } from "./types";

const PORTFOLIO_RANGE_LABEL_KEY = {
  day: "assetDetails.day",
  week: "assetDetails.week",
  month: "assetDetails.month",
  year: "assetDetails.year",
  all: "assetDetails.allTime",
} as const;

type UseChartSectionHeaderViewModelProps = Readonly<{
  balanceInfo: PortfolioBalanceInfo;
  hoveredBalance: number | null;
}>;

export function useChartSectionHeaderViewModel({
  balanceInfo,
  hoveredBalance,
}: UseChartSectionHeaderViewModelProps): ChartSectionHeaderViewModel {
  const { t } = useTranslation();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("desktop");
  const { isLoading } = usePortfolioBalanceDisplayState();
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

  const { percentageText, variant: variationVariant } = useTrendViewModel({
    valueChange: balanceInfo.valueChange,
    useDiscreetMasking: true,
  });

  const variationText = useMemo(() => {
    if (discreet) return "***";
    return formatSignedFiatVariation(balanceInfo.valueChange.value, fiatUnit, locale);
  }, [balanceInfo.valueChange.value, discreet, fiatUnit, locale]);

  const rangeLabel = t(PORTFOLIO_RANGE_LABEL_KEY[selectedTimeRange]);

  return {
    balance,
    balanceAvailable: balanceInfo.isAvailable,
    isLoading,
    shouldDisplayBalanceRefreshRework,
    balanceFormatter,
    discreet,
    percentageText,
    variationText,
    variationVariant,
    rangeLabel,
  };
}
