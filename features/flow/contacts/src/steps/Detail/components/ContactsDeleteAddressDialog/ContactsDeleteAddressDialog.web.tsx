import React from "react";
import { ContactsDeleteConfirmationDialog } from "../ContactsDeleteConfirmationDialog/ContactsDeleteConfirmationDialog";
import type { ContactsDeleteAddressDialogProps } from "./types";

export function ContactsDeleteAddressDialog(
  props: ContactsDeleteAddressDialogProps,
): React.ReactNode {
  return (
    <ContactsDeleteConfirmationDialog
      {...props}
      dialogTestId="contacts-delete-address-dialog"
      confirmTestId="contacts-delete-address-confirm"
    />
  );
}
