import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { useAddContactLabels } from "./copy/useAddContactLabels";
import type { AddContactContentViewModel } from "./types";

export type ContactsAddContactFooterProps = Pick<
  AddContactContentViewModel,
  "isConfirmEnabled" | "isSaving" | "onConfirm"
>;

export function ContactsAddContactFooter({
  isConfirmEnabled,
  isSaving,
  onConfirm,
}: ContactsAddContactFooterProps): React.JSX.Element {
  const labels = useAddContactLabels();
  return (
    <Button
      appearance="base"
      size="lg"
      isFull
      disabled={!isConfirmEnabled}
      loading={isSaving}
      onPress={() => void onConfirm()}
      testID="contacts-add-contact-save"
    >
      {labels.confirmAddContact}
    </Button>
  );
}
