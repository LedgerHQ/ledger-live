import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

export type ContactsAddContactHeaderButtonProps = {
  addContactLabel: string;
};

export function ContactsAddContactHeaderButton({
  addContactLabel,
}: Readonly<ContactsAddContactHeaderButtonProps>) {
  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={Plus}
      disabled
      accessibilityLabel={addContactLabel}
      testID="contacts-add-contact-button"
    />
  );
}
