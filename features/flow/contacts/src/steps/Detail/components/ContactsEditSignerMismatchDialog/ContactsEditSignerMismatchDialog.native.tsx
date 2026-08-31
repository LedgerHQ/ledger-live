import React from "react";
import { InformationFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "@features/platform-contacts/native";
import type { ContactsEditSignerMismatchDrawerProps } from "./types";

export function ContactsEditSignerMismatchDialog({
  isOpen,
  bottomInset = 0,
  labels,
  onConnectDifferentDevice,
  onCancel,
}: ContactsEditSignerMismatchDrawerProps): React.JSX.Element {
  return (
    <ContactConfirmationBottomSheet
      isOpen={isOpen}
      bottomInset={bottomInset}
      icon={InformationFill}
      labels={{
        title: labels.title,
        description: labels.description,
        confirm: labels.connectDifferentDevice,
        cancel: labels.cancel,
      }}
      confirmAppearance="base"
      confirmTestID="contacts-edit-signer-mismatch-connect"
      cancelTestID="contacts-edit-signer-mismatch-cancel"
      onConfirm={onConnectDifferentDevice}
      onCancel={onCancel}
    />
  );
}
