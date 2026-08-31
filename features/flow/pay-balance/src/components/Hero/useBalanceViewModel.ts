import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "@shared/i18n";
import { PAY_CARD_BALANCE_FILTER_ALL } from "../../state";
import { resolveSelection } from "../../logic/resolveSelection";
import type { BalanceLabels, BalanceProps, BalanceViewProps } from "../../types";

export function useBalanceViewModel({
  status,
  stableBalance,
  filter,
  hasBalance,
  filterOptions,
  formatCountervalue,
  onConfirmFilter,
  onTrackEvent,
  actionTiles,
}: BalanceProps): BalanceViewProps {
  const { t } = useTranslation();

  const labels: BalanceLabels = useMemo(
    () => ({
      emptyTitle: t("payTab.balance.emptyTitle"),
      emptyDescription: t("payTab.balance.emptyDescription"),
      allStablecoins: t("payTab.balance.filter.allStablecoins"),
      filterDialogTitle: t("payTab.balance.filter.dialogTitle"),
      filterDialogDescription: t("payTab.balance.filter.dialogDescription"),
      filterDialogBanner: t("payTab.balance.filter.dialogBanner"),
      confirm: t("payTab.balance.filter.confirm"),
    }),
    [t],
  );

  const optionIds = useMemo(() => filterOptions.map(option => option.id), [filterOptions]);
  const effectiveFilter = resolveSelection(filter, optionIds);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const onOpenFilter = useCallback(() => {
    setIsFilterOpen(true);
    onTrackEvent?.("button_clicked", { button: "balance_filter" });
  }, [onTrackEvent]);

  const onCloseFilter = useCallback(() => {
    setIsFilterOpen(false);
  }, []);

  const selectedOption = useMemo(
    () =>
      effectiveFilter === PAY_CARD_BALANCE_FILTER_ALL
        ? undefined
        : filterOptions.find(option => option.id === effectiveFilter),
    [effectiveFilter, filterOptions],
  );

  if (!hasBalance) {
    return { displayMode: "empty", labels, actionTiles };
  }

  return {
    displayMode: "funded",
    balance: stableBalance,
    formatCountervalue,
    isLoading: status === "loading",
    labels,
    filter: effectiveFilter,
    options: filterOptions,
    selectedOption,
    isFilterOpen,
    onOpenFilter,
    onCloseFilter,
    onConfirmFilter,
    onTrackEvent,
    actionTiles,
  };
}
