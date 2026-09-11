import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsAddContactFooterProps } from "./types";

export function ContactsAddContactFooter({
  isConfirmEnabled,
  isSaving,
  labels,
  onConfirm,
}: ContactsAddContactFooterProps): React.JSX.Element {
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
      {labels.confirmName}
    </Button>
  );
}
