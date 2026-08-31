import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import type { ContactsDeleteAddressDialogProps } from "./types";

export function ContactsDeleteAddressDialog(
  props: ContactsDeleteAddressDialogProps,
): React.ReactNode {
  return (
    <ContactConfirmationDialog
      {...props}
      dialogTestId="contacts-delete-address-dialog"
      confirmTestId="contacts-delete-address-confirm"
    />
  );
}
