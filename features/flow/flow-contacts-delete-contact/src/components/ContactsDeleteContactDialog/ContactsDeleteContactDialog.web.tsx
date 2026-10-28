import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useDeleteContactLabels } from "../../copy/useDeleteContactLabels";
import type { ContactsDeleteContactDialogProps } from "./types";

export function ContactsDeleteContactDialog({
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: ContactsDeleteContactDialogProps): React.ReactNode {
  const labels = useDeleteContactLabels();

  return (
    <ContactConfirmationDialog
      isOpen={isOpen}
      tone="destructive"
      labels={labels}
      isConfirming={isDeleting}
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
      testID="contacts-delete-contact-dialog"
      confirmTestID="contacts-delete-contact-confirm"
    />
  );
}
