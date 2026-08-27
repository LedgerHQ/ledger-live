import React, { useCallback } from "react";
import {
  Banner,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@ledgerhq/lumen-ui-react";
import type { BalanceFilterPickerViewProps } from "../../types";
import { BalanceFilterOptionRow } from "./BalanceFilterOptionRow";

export function BalanceFilterPickerView({
  isOpen,
  draftFilter,
  options,
  labels,
  onClose,
  onSelectDraft,
  onConfirm,
}: BalanceFilterPickerViewProps) {
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader
          density="expanded"
          title={labels.filterDialogTitle}
          description={labels.filterDialogDescription}
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-8">
          <div className="flex flex-col gap-8" data-testid="pay-card-balance-filter-picker">
            {options.map(option => (
              <BalanceFilterOptionRow
                key={option.id}
                option={option}
                selected={option.id === draftFilter}
                onSelect={onSelectDraft}
              />
            ))}
          </div>
          <Banner appearance="info" title={labels.filterDialogBanner} />
        </DialogBody>
        <DialogFooter className="flex-col gap-16">
          <Button
            appearance="base"
            size="lg"
            className="w-full"
            onClick={onConfirm}
            data-testid="pay-card-balance-filter-confirm"
          >
            {labels.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
