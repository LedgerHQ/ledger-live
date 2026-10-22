import React from "react";
import { Button } from "@ledgerhq/lumen-ui-rnative";
import { LedgerLogo } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useEditContactLabels } from "./copy/useEditContactLabels";
import type { ContactsRenameContactFooterProps } from "./types";

export function ContactsRenameContactFooter({
  isConfirmEnabled,
  isSaving,
  isDeviceRequired,
  onConfirm,
}: ContactsRenameContactFooterProps): React.JSX.Element {
  const labels = useEditContactLabels();

  return (
    <Button
      appearance="base"
      size="lg"
      isFull
      disabled={!isConfirmEnabled}
      icon={isDeviceRequired ? LedgerLogo : undefined}
      loading={isSaving}
      onPress={() => void onConfirm()}
      testID="contacts-rename-contact-confirm"
    >
      {labels.confirmName}
    </Button>
  );
}
