import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useAddContactLabels } from "./copy/useAddContactLabels";
import { ContactsAddContactContent } from "./ContactsAddContactContent";
import type { AddContactDialogViewModel } from "./types";

export function ContactsAddContactDialog({
  isOpen,
  onClose,
  ...contentProps
}: AddContactDialogViewModel): React.ReactNode {
  const labels = useAddContactLabels();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="pb-24" data-testid="contacts-add-contact-dialog">
        <DialogHeader density="expanded" title={labels.title} onClose={onClose} />
        <DialogBody className="p-0">
          <ContactsAddContactContent {...contentProps} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
