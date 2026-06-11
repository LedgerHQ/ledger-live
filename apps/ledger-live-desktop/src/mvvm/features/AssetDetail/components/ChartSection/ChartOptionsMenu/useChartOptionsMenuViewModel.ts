import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHideTransactionsOnChart } from "~/renderer/actions/market";
import { hideTransactionsOnChartSelector } from "~/renderer/reducers/market";
import { track } from "~/renderer/analytics/segment";
import { ASSET_DETAIL_TRACKING_PAGE_NAME } from "LLD/features/AssetDetail/constants";

export type UseChartOptionsMenuViewModelProps = Readonly<{
  currencyId?: string;
}>;

export type ChartOptionsMenuViewModel = Readonly<{
  optionsAriaLabel: string;
  toggleLabel: string;
  isHidden: boolean;
  onToggle: () => void;
}>;

export function useChartOptionsMenuViewModel({
  currencyId,
}: UseChartOptionsMenuViewModelProps): ChartOptionsMenuViewModel {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isHidden = useSelector(hideTransactionsOnChartSelector);

  const onToggle = useCallback(() => {
    const nextHidden = !isHidden;
    track("button_clicked", {
      button: "hide_transactions_graph",
      page: ASSET_DETAIL_TRACKING_PAGE_NAME,
      currency: currencyId,
      is_hidden: nextHidden,
    });
    dispatch(setHideTransactionsOnChart(nextHidden));
  }, [dispatch, isHidden, currencyId]);

  return useMemo(
    () => ({
      optionsAriaLabel: t("assetDetails.chartOptions.menu"),
      toggleLabel: isHidden
        ? t("assetDetails.chartOptions.showTransactions")
        : t("assetDetails.chartOptions.hideTransactions"),
      isHidden,
      onToggle,
    }),
    [t, isHidden, onToggle],
  );
}
