import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { cn } from "@ledgerhq/lumen-utils-shared";
import { ConfirmError } from "./ConfirmError";
import { ConfirmPrompt } from "./ConfirmPrompt";
import type { ConfirmSheetProps } from "../../../types";

export function ConfirmSheet({ status, confirmState, onConfirm, onClose }: ConfirmSheetProps) {
  if (confirmState === "closed") return null;

  const isPending = confirmState === "pending";
  const hasFailed = confirmState === "error";
  const handleClose = () => {
    if (!isPending) onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="pb-24" data-testid="freeze-confirm-sheet">
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-full",
            hasFailed ? "bg-gradient-error" : "bg-gradient-muted",
          )}
          data-testid={`freeze-confirm-gradient-${hasFailed ? "error" : "muted"}`}
        />
        <DialogHeader density="compact" onClose={handleClose} />
        <DialogBody
          className="flex flex-col items-center gap-32 px-24 pb-24 text-center"
          data-testid="freeze-confirm-sheet-content"
        >
          {hasFailed ? (
            <ConfirmError status={status} onConfirm={onConfirm} onClose={handleClose} />
          ) : (
            <ConfirmPrompt
              status={status}
              isPending={isPending}
              onConfirm={onConfirm}
              onClose={handleClose}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
