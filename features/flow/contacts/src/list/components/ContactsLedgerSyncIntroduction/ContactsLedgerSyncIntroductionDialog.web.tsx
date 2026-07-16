import React from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { ContactsLedgerSyncIntroduction } from "../../types";

type ContactsLedgerSyncIntroductionDialogProps = Readonly<
  ContactsLedgerSyncIntroduction & {
    open: boolean;
  }
>;

export function ContactsLedgerSyncIntroductionDialog({
  open,
  description,
  dismissLabel,
  onDismiss,
}: ContactsLedgerSyncIntroductionDialogProps): React.ReactNode {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onDismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} className="w-[400px] bg-base p-0">
        <DialogHeader density="compact" />
        <DialogBody className="flex flex-col gap-24 px-24 pb-24">
          <p className="body-1 text-base">{description}</p>
          <Button appearance="base" size="md" onClick={onDismiss} className="w-full">
            {dismissLabel}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
