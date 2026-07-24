import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "../../../components/ContactAvatar/ContactAvatar.native";
import type { ContactsListItem } from "../..";

type ContactsSavedContactListItemProps = Readonly<{
  contact: ContactsListItem;
  addressCountLabel: string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsSavedContactListItem({
  contact,
  addressCountLabel,
  onOpen,
}: ContactsSavedContactListItemProps): React.JSX.Element {
  return (
    <ListItem
      testID={`contacts-saved-contact-${contact.contactId}`}
      onPress={() => onOpen(contact.contactId)}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <ContactAvatar contactId={contact.contactId} name={contact.name} />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>{addressCountLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
