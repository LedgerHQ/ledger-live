import React, { useEffect, useRef } from "react";
import { Button, Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";

type ContactsLedgerSyncIntroductionDialogProps = Readonly<{
  open: boolean;
  description: string;
  dismissLabel: string;
  onDismiss: () => void;
}>;

export function ContactsLedgerSyncIntroductionDialog({
  open,
  description,
  dismissLabel,
  onDismiss,
}: ContactsLedgerSyncIntroductionDialogProps): React.ReactNode {
  const hasDismissed = useRef(false);

  useEffect(() => {
    if (open) {
      hasDismissed.current = false;
    }
  }, [open]);

  const dismiss = () => {
    if (hasDismissed.current) {
      return;
    }

    hasDismissed.current = true;
    onDismiss();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      dismiss();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} height="fit">
      <DialogContent aria-describedby={undefined} className="w-[400px] bg-base p-0">
        <DialogHeader density="compact" onClose={dismiss} />
        <DialogBody className="flex flex-col gap-24 px-24 pb-24">
          <p className="body-1 text-base">{description}</p>
          <Button appearance="base" size="md" onClick={dismiss} className="w-full">
            {dismissLabel}
          </Button>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
