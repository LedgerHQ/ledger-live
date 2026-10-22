import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useDeleteContactLabels } from "../../copy/useDeleteContactLabels";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog(
  props: ContactsDeleteContactDialogProps,
): React.ReactNode {
  const labels = useDeleteContactLabels();

  return (
    <ContactConfirmationDialog
      {...props}
      labels={labels}
      dialogTestId="contacts-delete-contact-dialog"
      confirmTestId="contacts-delete-contact-confirm"
    />
  );
}
