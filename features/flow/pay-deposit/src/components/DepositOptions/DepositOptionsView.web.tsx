import React, { useCallback } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { DepositOptionsViewProps } from "../../types";
import { DepositOptionRow } from "./DepositOptionRow";

export function DepositOptionsView({
  isOpen,
  title,
  options,
  onClose,
  onSelectOption,
}: DepositOptionsViewProps) {
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
        <DialogHeader density="expanded" title={title} onClose={onClose} />
        <DialogBody className="flex flex-col gap-8">
          <div className="flex flex-col gap-8" data-testid="pay-card-deposit-options">
            {options.map(option => (
              <DepositOptionRow key={option.id} option={option} onSelect={onSelectOption} />
            ))}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
