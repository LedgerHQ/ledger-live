import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Contact, Plus } from "@ledgerhq/lumen-ui-rnative/symbols";

export type AddContactViewProps = Readonly<{
  newContactLabel: string;
  existingContactLabel: string;
  onAddNewContact: () => void;
  onAddToExistingContact: () => void;
}>;

export function AddContactView({
  newContactLabel,
  existingContactLabel,
  onAddNewContact,
  onAddToExistingContact,
}: AddContactViewProps): React.JSX.Element {
  return (
    <>
      <ListItem onPress={onAddNewContact} testID="send-add-contact-new">
        <ListItemLeading>
          <Spot appearance="icon" icon={Plus} />
          <ListItemContent>
            <ListItemTitle>{newContactLabel}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
      <ListItem onPress={onAddToExistingContact} testID="send-add-contact-existing">
        <ListItemLeading>
          <Spot appearance="icon" icon={Contact} />
          <ListItemContent>
            <ListItemTitle>{existingContactLabel}</ListItemTitle>
          </ListItemContent>
        </ListItemLeading>
      </ListItem>
    </>
  );
}
