import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useDeleteAddressLabels } from "../../copy/useDeleteAddressLabels";
import type { ContactsDeleteAddressDialogProps } from "./types";

export function ContactsDeleteAddressDialog(
  props: ContactsDeleteAddressDialogProps,
): React.ReactNode {
  const labels = useDeleteAddressLabels();

  return (
    <ContactConfirmationDialog
      {...props}
      labels={labels}
      dialogTestId="contacts-delete-address-dialog"
      confirmTestId="contacts-delete-address-confirm"
    />
  );
}
