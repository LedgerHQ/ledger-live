import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useTranslation } from "@shared/i18n";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: ContactsDeleteContactDialogProps): React.ReactNode {
  const { t } = useTranslation();
  const labels = {
    title: t("contacts.deleteContact.title"),
    description: t("contacts.deleteContact.description"),
    confirm: t("contacts.deleteContact.confirm"),
    cancel: t("contacts.deleteContact.cancel"),
  };

  return (
    <ContactConfirmationDialog
      isOpen={isOpen}
      isDeleting={isDeleting}
      labels={labels}
      dialogTestId="contacts-delete-contact-dialog"
      confirmTestId="contacts-delete-contact-confirm"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
