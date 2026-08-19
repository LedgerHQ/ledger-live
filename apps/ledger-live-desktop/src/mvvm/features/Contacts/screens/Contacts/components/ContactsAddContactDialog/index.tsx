import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { AddContactAppAdapterResult } from "@features/flow-contacts";
import { ContactsAddContactContent } from "@features/flow-contacts-add-contact";

const NAMING_DISCLAIMER_ID = "contacts-add-contact-naming-disclaimer";

export function ContactsAddContactDialog({
  isOpen,
  onClose,
  ...contentProps
}: AddContactAppAdapterResult): React.ReactNode {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        aria-describedby={NAMING_DISCLAIMER_ID}
        className="w-[400px] bg-canvas-sheet pb-24"
        data-testid="contacts-add-contact-dialog"
      >
        <DialogHeader density="expanded" title={contentProps.labels.title} onClose={onClose} />
        <DialogBody className="p-0">
          <ContactsAddContactContent {...contentProps} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
