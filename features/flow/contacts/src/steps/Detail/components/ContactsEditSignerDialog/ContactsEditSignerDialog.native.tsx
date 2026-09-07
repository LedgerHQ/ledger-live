import React from "react";
import { ShieldCheck } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "@features/platform-contacts/native";
import type { ContactsEditSignerDrawerProps } from "./types";

export function ContactsEditSignerDialog({
  isOpen,
  bottomInset = 0,
  labels,
  onConfirm,
  onCancel,
}: ContactsEditSignerDrawerProps): React.JSX.Element {
  return (
    <ContactConfirmationBottomSheet
      isOpen={isOpen}
      bottomInset={bottomInset}
      icon={ShieldCheck}
      labels={labels}
      confirmAppearance="base"
      confirmTestID="contacts-edit-signer-confirm"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
