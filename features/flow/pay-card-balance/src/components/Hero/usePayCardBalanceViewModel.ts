import { useCallback, useMemo, useState } from "react";
import { PAY_CARD_BALANCE_FILTER_ALL } from "../../state";
import { resolveSelection } from "../../logic/resolveSelection";
import type { PayCardBalanceProps, PayCardBalanceViewProps } from "../../types";

export function usePayCardBalanceViewModel({
  status,
  stableBalance,
  filter,
  hasBalance,
  filterOptions,
  formatCountervalue,
  onConfirmFilter,
  onTrackEvent,
  actionTiles,
  labels,
}: PayCardBalanceProps): PayCardBalanceViewProps {
  const isLoading = status === "loading";
  const isFunded = isLoading || (status === "ready" && hasBalance);

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

  if (!isFunded) {
    return { displayMode: "empty", labels };
  }

  return {
    displayMode: "funded",
    balance: stableBalance,
    formatCountervalue,
    isLoading,
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
