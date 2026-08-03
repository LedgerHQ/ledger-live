import React, { useEffect, useState } from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { ContactAddressDetailActions } from "./ContactAddressDetailActions.web";
import { ContactAddressDetailSummary } from "./ContactAddressDetailSummary.web";
import type { ContactAddressDetailDialogProps } from "./types";

const COPY_FEEDBACK_MS = 3000;

export function ContactAddressDetailDialog({
  isOpen,
  contactName,
  row,
  network,
  labels,
  onClose,
}: ContactAddressDetailDialogProps): React.ReactNode {
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setHasCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!hasCopied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasCopied(false), COPY_FEEDBACK_MS);

    return () => window.clearTimeout(timeoutId);
  }, [hasCopied]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleCopy = async () => {
    if (row === undefined) {
      return;
    }

    await navigator.clipboard.writeText(row.address);
    setHasCopied(true);
  };

  if (row === undefined || network === undefined) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[400px] bg-canvas-sheet"
        data-testid="contacts-address-detail-dialog"
      >
        <DialogHeader title={contactName} onClose={onClose} />
        <DialogBody className="flex flex-col items-center gap-40 p-24">
          <ContactAddressDetailSummary
            row={row}
            network={network}
            formatNetworkTag={labels.formatNetworkTag}
          />
          <ContactAddressDetailActions
            labels={labels}
            hasCopied={hasCopied}
            onCopy={() => void handleCopy()}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
