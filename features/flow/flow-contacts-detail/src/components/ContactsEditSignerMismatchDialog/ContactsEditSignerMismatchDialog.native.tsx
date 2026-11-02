import React from "react";
import { ContactConfirmationDialog } from "@features/platform-contacts";
import { useEditSignerMismatchCopy } from "../../copy/useEditSignerMismatchCopy";
import type { ContactsEditSignerMismatchDialogProps } from "./types";

export type ContactsEditSignerMismatchDrawerProps = ContactsEditSignerMismatchDialogProps &
  Readonly<{
    bottomInset?: number;
  }>;

export function ContactsEditSignerMismatchDialog({
  isOpen,
  onConnectDifferentDevice,
  onCancel,
}: ContactsEditSignerMismatchDrawerProps): React.JSX.Element {
  const labels = useEditSignerMismatchCopy();

  return (
    <ContactConfirmationDialog
      isOpen={isOpen}
      tone="neutral"
      labels={{
        title: labels.title,
        description: labels.description,
        confirm: labels.connectDifferentDevice,
        cancel: labels.cancel,
      }}
      confirmTestID="contacts-edit-signer-mismatch-connect"
      cancelTestID="contacts-edit-signer-mismatch-cancel"
      onConfirm={onConnectDifferentDevice}
      onCancel={onCancel}
    />
  );
}
