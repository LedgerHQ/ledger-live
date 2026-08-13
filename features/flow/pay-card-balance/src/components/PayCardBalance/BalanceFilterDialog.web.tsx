import React from "react";
import type { PayCardBalanceFilter } from "@domain/entity-pay-card";
import { BalanceFilterDialogView } from "./BalanceFilterDialogView";
import { useBalanceFilterDialogViewModel } from "./useBalanceFilterDialogViewModel";
import type { PayCardBalanceFilterLabels, PayCardBalanceFilterOption } from "./types";

export type BalanceFilterDialogProps = Readonly<{
  isOpen: boolean;
  filter: PayCardBalanceFilter;
  options: readonly PayCardBalanceFilterOption[];
  labels: PayCardBalanceFilterLabels;
  onClose: () => void;
  onConfirmFilter: (filter: PayCardBalanceFilter) => void;
  onTrackEvent?: (event: string, params: Record<string, unknown>) => void;
}>;

export function BalanceFilterDialog({
  isOpen,
  filter,
  options,
  labels,
  onClose,
  onConfirmFilter,
  onTrackEvent,
}: BalanceFilterDialogProps) {
  const { draftFilter, onSelectDraft, onConfirm } = useBalanceFilterDialogViewModel({
    isOpen,
    activeFilter: filter,
    options,
    onConfirmFilter,
    onClose,
    onTrackEvent,
  });

  return (
    <BalanceFilterDialogView
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
