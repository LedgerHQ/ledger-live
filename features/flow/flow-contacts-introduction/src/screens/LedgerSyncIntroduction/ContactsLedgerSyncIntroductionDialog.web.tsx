import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";
import { useSingleFireDismiss } from "../../internals/useSingleFireDismiss";
import type { ContactsLedgerSyncIntroductionDialogProps } from "./types";

export function ContactsLedgerSyncIntroductionDialog({
  open,
  title,
  description,
  activateLabel,
  dismissLabel,
  onActivate,
  onDismiss,
}: ContactsLedgerSyncIntroductionDialogProps): React.ReactNode {
  const dismiss = useSingleFireDismiss(onDismiss, open);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      dismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height="fit">
      <DialogContent
        aria-describedby={undefined}
        className="w-[400px] bg-canvas-sheet p-0"
        data-testid="contacts-ledger-sync-introduction-dialog"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted"
        />
        <DialogHeader density="compact" onClose={dismiss} />
        <DialogBody className="flex flex-col gap-32 px-24 pb-24">
          <div className="flex flex-col items-center gap-24">
            <Spot appearance="icon" size={72} icon={Refresh} />
            <div className="flex flex-col items-center gap-8 text-center">
              <h2 className="heading-4-semi-bold text-base">{title}</h2>
              <p className="body-2 text-muted">{description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-16">
            <Button
              appearance="base"
              size="lg"
              isFull
              onClick={onActivate}
              data-testid="contacts-ledger-sync-introduction-activate"
            >
              {activateLabel}
            </Button>
            <Button
              appearance="gray"
              size="lg"
              isFull
              onClick={dismiss}
              data-testid="contacts-ledger-sync-introduction-dismiss"
            >
              {dismissLabel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
