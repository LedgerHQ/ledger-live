import React from "react";
import { Trash } from "@ledgerhq/lumen-ui-rnative/symbols";
import { ContactConfirmationBottomSheet } from "@features/platform-contacts";
import { useDeleteAddressLabels } from "../../copy/useDeleteAddressLabels";
import type { ContactsDeleteAddressDrawerProps } from "./types";

export function ContactsDeleteAddressDialog({
  isOpen,
  isDeleting,
  bottomInset = 0,
  onConfirm,
  onCancel,
}: ContactsDeleteAddressDrawerProps): React.JSX.Element {
  const labels = useDeleteAddressLabels();

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
      contentTestID="contacts-delete-address-content"
      onConfirm={() => void onConfirm()}
      onCancel={onCancel}
    />
  );
}
