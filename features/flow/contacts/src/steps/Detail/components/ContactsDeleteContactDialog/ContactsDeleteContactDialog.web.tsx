import React from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Trash } from "@ledgerhq/lumen-ui-react/symbols";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog({
  isOpen,
  isDeleting,
  labels,
  onConfirm,
  onCancel,
}: ContactsDeleteContactDialogProps): React.ReactNode {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[400px] bg-canvas-sheet pb-24"
        data-testid="contacts-delete-contact-dialog"
      >
        <DialogHeader density="compact" onClose={onCancel} />
        <DialogBody className="flex flex-col items-center gap-32 px-24 pb-24 text-center">
          <div className="flex flex-col items-center gap-24">
            <Spot appearance="icon" icon={Trash} size={56} />
            <div className="flex flex-col gap-8">
              <h2 className="heading-3-semi-bold text-base">{labels.title}</h2>
              <p className="body-2 text-muted">{labels.description}</p>
            </div>
          </div>
          <div className="flex w-full gap-16">
            <Button
              appearance="gray"
              size="lg"
              isFull
              onClick={onCancel}
              disabled={isDeleting}
            >
              {labels.cancel}
            </Button>
            <Button
              appearance="red"
              size="lg"
              isFull
              loading={isDeleting}
              disabled={isDeleting}
              onClick={() => void onConfirm()}
              data-testid="contacts-delete-contact-confirm"
            >
              {labels.confirm}
            </Button>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
