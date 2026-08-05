import React from "react";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "../ContactConfirmationBottomSheet/ContactConfirmationBottomSheet.native";
import type { ContactsDeleteContactDrawerProps } from "./types";

export function ContactsDeleteContactDialog({
  isOpen,
  isDeleting,
  bottomInset = 0,
  labels,
  onConfirm,
  onCancel,
}: ContactsDeleteContactDrawerProps): React.JSX.Element {
  return (
    <ContactConfirmationBottomSheet
      isOpen={isOpen}
      bottomInset={bottomInset}
      icon={Trash}
      labels={labels}
      confirmAppearance="red"
      confirmLoading={isDeleting}
      confirmDisabled={isDeleting}
      confirmTestID="contacts-delete-contact-confirm"
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
    />
  );
}
