import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsEditSignerMismatchDialogProps } from "./types";

export function ContactsEditSignerMismatchDialog({
  isOpen,
  labels,
  onConnectDifferentDevice,
  onCancel,
}: ContactsEditSignerMismatchDialogProps): React.ReactNode {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[400px] bg-canvas-sheet pb-24"
        data-testid="contacts-edit-signer-mismatch-dialog"
      >
        <DialogHeader density="compact" onClose={onCancel} />
        <DialogBody className="flex flex-col items-center gap-32 px-24 pb-24 text-center">
          <div className="flex flex-col items-center gap-24">
            <Spot appearance="icon" icon={LedgerDevices} size={56} />
            <div className="flex flex-col gap-8">
              <h2 className="heading-3-semi-bold text-base">{labels.title}</h2>
              <p className="body-2 text-muted">{labels.description}</p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-16">
            <Button
              appearance="base"
              size="lg"
              isFull
              onClick={onConnectDifferentDevice}
              data-testid="contacts-edit-signer-mismatch-connect"
            >
              {labels.connectDifferentDevice}
            </Button>
            <Button appearance="gray" size="lg" isFull onClick={onCancel}>
              {labels.cancel}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
