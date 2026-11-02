import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useDeleteAddressLabels } from "../../copy/useDeleteAddressLabels";
import type { ContactsDeleteAddressDialogProps } from "./types";

export function ContactsDeleteAddressDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: ContactsDeleteAddressDialogProps): React.ReactNode {
  const labels = useDeleteAddressLabels();

  return (
    <ContactConfirmationDialog
      isOpen={isOpen}
      tone="destructive"
      labels={labels}
      isConfirming={isDeleting}
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
      testID="contacts-delete-address-dialog"
      confirmTestID="contacts-delete-address-confirm"
    />
  );
}
