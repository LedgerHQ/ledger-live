import React from "react";
import type { BalanceFilter } from "../../state";
import { BalanceFilterPickerView } from "./BalanceFilterPickerView";
import { useBalanceFilterPickerViewModel } from "./useBalanceFilterPickerViewModel";
import type { BalanceFilterLabels, BalanceFilterOption } from "../../types";

export type BalanceFilterPickerProps = Readonly<{
  isOpen: boolean;
  filter: BalanceFilter;
  options: readonly BalanceFilterOption[];
  labels: BalanceFilterLabels;
  onClose: () => void;
  onConfirmFilter: (filter: BalanceFilter) => void;
}>;

export function BalanceFilterPicker({
  isOpen,
  filter,
  options,
  labels,
  onClose,
  onConfirmFilter,
}: BalanceFilterPickerProps) {
  const { draftFilter, onSelectDraft, onConfirm } = useBalanceFilterPickerViewModel({
    isOpen,
    activeFilter: filter,
    options,
    onConfirmFilter,
    onClose,
  });

  return (
    <BalanceFilterPickerView
      isOpen={isOpen}
      draftFilter={draftFilter}
      options={options}
      labels={labels}
      onClose={onClose}
      onSelectDraft={onSelectDraft}
      onConfirm={onConfirm}
    />
  );
}
