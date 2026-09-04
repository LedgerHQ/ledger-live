import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { ContactsAddContactContent } from "./ContactsAddContactContent.web";
import type { AddContactDialogViewModel } from "./types";

export function ContactsAddContactDialog({
  isOpen,
  onClose,
  labels,
  ...contentProps
}: AddContactDialogViewModel): React.ReactNode {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="pb-24" data-testid="contacts-add-contact-dialog">
        <DialogHeader density="expanded" title={labels.title} onClose={onClose} />
        <DialogBody className="p-0">
          <ContactsAddContactContent labels={labels} {...contentProps} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
