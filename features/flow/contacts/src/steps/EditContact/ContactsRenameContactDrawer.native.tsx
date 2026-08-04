import React from "react";
import { ContactsContactNameDrawerContent } from "../../components/ContactsContactNameDrawer/ContactsContactNameDrawerContent.native";
import type { ContactsRenameContactDrawerProps } from "./types";

export function ContactsRenameContactDrawer({
  isOpen,
  isConfirmEnabled,
  isSaving,
  draftName,
  invalidNameError,
  bottomInset = 0,
  keyboardInset = 0,
  labels,
  onDraftNameChange,
  onConfirm,
}: ContactsRenameContactDrawerProps): React.JSX.Element {
  return (
    <ContactsContactNameDrawerContent
      isOpen={isOpen}
      isConfirmEnabled={isConfirmEnabled}
      isSaving={isSaving}
      draftName={draftName}
      invalidNameError={invalidNameError}
      bottomInset={bottomInset}
      keyboardInset={keyboardInset}
      labels={labels}
      confirmLabel={labels.applyChanges}
      confirmTestID="contacts-rename-contact-confirm"
      onDraftNameChange={onDraftNameChange}
      onConfirm={onConfirm}
    />
  );
}
