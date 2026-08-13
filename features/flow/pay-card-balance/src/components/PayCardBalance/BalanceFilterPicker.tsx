import React from "react";
import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import { BalanceFilterPickerView } from "./BalanceFilterPickerView";
import { useBalanceFilterPickerViewModel } from "./useBalanceFilterPickerViewModel";
import type { PayCardBalanceFilterLabels, PayCardBalanceFilterOption } from "./types";

export type BalanceFilterPickerProps = Readonly<{
  isOpen: boolean;
  filter: PayCardBalanceFilter;
  options: readonly PayCardBalanceFilterOption[];
  labels: PayCardBalanceFilterLabels;
  onClose: () => void;
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export function BalanceFilterPicker({
  isOpen,
  filter,
  options,
  labels,
  onClose,
  onConfirmFilter,
  onTrackEvent,
}: BalanceFilterPickerProps) {
  const { draftFilter, onSelectDraft, onConfirm } = useBalanceFilterPickerViewModel({
    isOpen,
    activeFilter: filter,
    options,
    onConfirmFilter,
    onClose,
    onTrackEvent,
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
