import React from "react";
import { ContactsDeleteConfirmationDialog } from "../ContactsDeleteConfirmationDialog/ContactsDeleteConfirmationDialog.web";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog(
  props: ContactsDeleteContactDialogProps,
): React.ReactNode {
  return (
    <ContactsDeleteConfirmationDialog
      {...props}
      dialogTestId="contacts-delete-contact-dialog"
      confirmTestId="contacts-delete-contact-confirm"
    />
  );
}
