import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import { getScrubVariation } from "@ledgerhq/live-common/market/utils/scrubVariation";
import { useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { formatCurrencyUnitFragment } from "@ledgerhq/live-common/currencies/index";
import { formatSmallestUnitSignedFiatVariation } from "LLD/components/LineChart/utils/formatSmallestUnitSignedFiatVariation";
import { useChartScrubHeaderDateLabel } from "LLD/components/LineChart/utils/useChartScrubHeaderDateLabel";
import {
  counterValueCurrencySelector,
  discreetModeSelector,
  localeSelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import type { ChartSectionHeaderInput } from "../types";
import {
  PORTFOLIO_RANGE_LABEL_KEY,
  portfolioRangeToLineChartRange,
} from "../../../utils/portfolioRangeMapping";
import type { ChartSectionHeaderViewModel } from "./types";

export function useChartSectionHeaderViewModel({
  balanceInfo,
  scrubSelection,
  chartPrices,
  isLoading,
}: ChartSectionHeaderInput): ChartSectionHeaderViewModel {
  const { t } = useTranslation();
  const selectedTimeRange = useSelector(selectedTimeRangeSelector);
  const counterValue = useSelector(counterValueCurrencySelector);
  const locale = useSelector(localeSelector);
  const discreet = useSelector(discreetModeSelector);
  const fiatUnit = counterValue.units[0];
  const selectedRange = portfolioRangeToLineChartRange(selectedTimeRange);
  const isScrubbing = scrubSelection != null;

  const balance = scrubSelection?.balance ?? balanceInfo.totalBalance;

  const balanceFormatter = useCallback(
    (value: number) =>
      formatCurrencyUnitFragment(fiatUnit, new BigNumber(value), {
        locale,
        showCode: true,
      }),
    [fiatUnit, locale],
  );

  const formatScrubHeaderDate = useChartScrubHeaderDateLabel(selectedRange);

  const scrubDateLabel =
    scrubSelection != null ? formatScrubHeaderDate(scrubSelection.timestamp) : undefined;

  const rangeLabel = t(PORTFOLIO_RANGE_LABEL_KEY[selectedTimeRange]);

  const scrubVariation = useMemo(() => {
    if (scrubSelection == null) return undefined;
    const baselinePrice = chartPrices[0];
    if (!Number.isFinite(baselinePrice)) return undefined;
    return getScrubVariation(baselinePrice, scrubSelection.balance, {
      percentageUnit: "percentPoints",
    });
  }, [scrubSelection, chartPrices]);

  const rangePercentageValue = (balanceInfo.valueChange.percentage ?? 0) * 100;
  const percentageValue = scrubVariation?.percentage ?? rangePercentageValue;

  const rangeVariationText = useMemo(() => {
    if (discreet) return "***";
    return formatSmallestUnitSignedFiatVariation(balanceInfo.valueChange.value, fiatUnit, locale);
  }, [balanceInfo.valueChange.value, discreet, fiatUnit, locale]);

  const variationText = useMemo(() => {
    if (scrubVariation == null) return rangeVariationText;
    if (discreet) return "***";
    return formatSmallestUnitSignedFiatVariation(scrubVariation.variationFiat, fiatUnit, locale);
  }, [scrubVariation, rangeVariationText, discreet, fiatUnit, locale]);

  return {
    totalBalanceLabel: t("assetDetails.totalBalance"),
    balance,
    balanceAvailable: balanceInfo.isAvailable,
    isLoading: isLoading && !isScrubbing,
    balanceFormatter,
    discreet,
    percentageValue,
    variationText,
    rangeLabel,
    scrubDateLabel,
  };
}
