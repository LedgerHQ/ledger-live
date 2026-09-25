import { useCallback, useEffect, useState } from "react";
import { trackButtonClicked } from "@features/platform-pay-analytics";
import { PAY_CARD_BALANCE_FILTER_ALL, type BalanceFilter } from "../../state";
import type { BalanceFilterPickerViewModel, BalanceFilterPickerViewModelParams } from "../../types";

export function useBalanceFilterPickerViewModel({
  isOpen,
  activeFilter,
  options,
  onConfirmFilter,
  onClose,
}: BalanceFilterPickerViewModelParams): BalanceFilterPickerViewModel {
  const [draftFilter, setDraftFilter] = useState<BalanceFilter>(activeFilter);

  useEffect(() => {
    if (isOpen) {
      setDraftFilter(activeFilter);
    }
  }, [isOpen, activeFilter]);

  const onSelectDraft = useCallback((next: BalanceFilter) => {
    setDraftFilter(next);
  }, []);

  const onConfirm = useCallback(() => {
    onConfirmFilter(draftFilter);
    const asset =
      draftFilter === PAY_CARD_BALANCE_FILTER_ALL
        ? PAY_CARD_BALANCE_FILTER_ALL
        : (options.find(option => option.id === draftFilter)?.ticker ?? draftFilter);
    trackButtonClicked({ button: "confirm balance filter", asset, page: "Pay" });
    onClose();
  }, [draftFilter, options, onConfirmFilter, onClose]);

  return { draftFilter, onSelectDraft, onConfirm };
}
