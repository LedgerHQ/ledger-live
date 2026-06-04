import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHideTransactionsOnChart } from "~/actions/market";
import { hideTransactionsOnChartSelector } from "~/reducers/market";
import { track } from "~/analytics";
import { useTranslation } from "~/context/Locale";

type Params = Readonly<{
  currencyId?: string;
}>;

export function useChartOptionsViewModel({ currencyId }: Params) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isHidden = useSelector(hideTransactionsOnChartSelector);

  const [isSheetOpen, setSheetOpen] = useState(false);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const onToggleTransactions = useCallback(() => {
    const nextHidden = !isHidden;
    track("button_clicked", {
      button: "hide_transactions_graph",
      page: "Asset Detail",
      currency: currencyId,
      is_hidden: nextHidden,
    });
    dispatch(setHideTransactionsOnChart(nextHidden));
    closeSheet();
  }, [dispatch, isHidden, closeSheet, currencyId]);

  return useMemo(
    () => ({
      isHidden,
      isSheetOpen,
      openSheet,
      closeSheet,
      onToggleTransactions,
      trailingAccessibilityLabel: t("assetDetail.chartOptions.openMenuA11yLabel"),
      toggleTransactionsTitle: isHidden
        ? t("assetDetail.chartOptions.showTransactions")
        : t("assetDetail.chartOptions.hideTransactions"),
    }),
    [isHidden, isSheetOpen, openSheet, closeSheet, onToggleTransactions, t],
  );
}

export type ChartOptionsViewModel = ReturnType<typeof useChartOptionsViewModel>;
