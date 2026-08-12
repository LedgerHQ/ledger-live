import React from "react";
import { ContactsContactNameDrawerContent } from "../../components/ContactsContactNameDrawer/ContactsContactNameDrawerContent.native";
import type { ContactsAddContactDrawerProps } from "./types";

export function ContactsAddContactDrawer({
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
}: ContactsAddContactDrawerProps): React.JSX.Element {
  return (
    <ContactsContactNameDrawerContent
      isOpen={isOpen}
      isConfirmEnabled={isConfirmEnabled}
      isSaving={isSaving}
      draftName={draftName}
      invalidNameError={invalidNameError}
      bottomInset={bottomInset}
      keyboardInset={keyboardInset}
      isInputEditable={!isSaving}
      labels={labels}
      confirmLabel={labels.confirmName}
      onDraftNameChange={onDraftNameChange}
      onConfirm={onConfirm}
    />
  );
}
