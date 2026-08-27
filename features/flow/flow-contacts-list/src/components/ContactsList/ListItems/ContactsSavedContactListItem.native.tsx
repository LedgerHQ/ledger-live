import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "@features/platform-contacts";
import type { ContactsListItem } from "../../../types";

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
        <ContactAvatar contactId={contact.contactId} name={contact.name} size="md" />
        <ListItemContent>
          <ListItemTitle testID={`contacts-saved-contact-${contact.contactId}-name`}>
            {contact.name}
          </ListItemTitle>
          <ListItemDescription testID={`contacts-saved-contact-${contact.contactId}-address-count`}>
            {addressCountLabel}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
