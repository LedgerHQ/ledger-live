import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog(
  props: ContactsDeleteContactDialogProps,
): React.ReactNode {
  return (
    <ContactConfirmationDialog
      {...props}
      dialogTestId="contacts-delete-contact-dialog"
      confirmTestId="contacts-delete-contact-confirm"
    />
  );
}
