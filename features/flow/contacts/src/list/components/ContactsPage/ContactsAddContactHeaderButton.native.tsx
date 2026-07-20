import React from "react";
import { IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

export type ContactsAddContactHeaderButtonProps = Readonly<{
  addContactLabel: string;
  onPress: () => void;
}>;

export function ContactsAddContactHeaderButton({
  addContactLabel,
  onPress,
}: ContactsAddContactHeaderButtonProps): React.JSX.Element {
  return (
    <IconButton
      appearance="no-background"
      size="md"
      icon={Plus}
      onPress={onPress}
      accessibilityLabel={addContactLabel}
      testID="contacts-add-contact-header"
    />
  );
}
