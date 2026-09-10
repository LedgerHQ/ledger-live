import React from "react";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import { useTranslation } from "@shared/i18n";
import { ContactsAddContactContent } from "./ContactsAddContactContent.web";
import type { AddContactDialogViewModel } from "./types";

export function ContactsAddContactDialog({
  isOpen,
  onClose,
  ...contentProps
}: AddContactDialogViewModel): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="pb-24" data-testid="contacts-add-contact-dialog">
        <DialogHeader density="expanded" title={t("contacts.addContact")} onClose={onClose} />
        <DialogBody className="p-0">
          <ContactsAddContactContent {...contentProps} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
