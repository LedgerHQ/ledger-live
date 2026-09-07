import React from "react";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "@features/platform-contacts/native";
import type { ContactsDeleteAddressDrawerProps } from "./types";

export function ContactsDeleteAddressDialog({
  isOpen,
  isDeleting,
  bottomInset = 0,
  labels,
  onConfirm,
  onCancel,
}: ContactsDeleteAddressDrawerProps): React.JSX.Element {
  return (
    <ContactConfirmationBottomSheet
      isOpen={isOpen}
      bottomInset={bottomInset}
      icon={Trash}
      labels={labels}
      confirmAppearance="red"
      confirmLoading={isDeleting}
      confirmDisabled={isDeleting}
      confirmTestID="contacts-delete-address-confirm"
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
    />
  );
}
