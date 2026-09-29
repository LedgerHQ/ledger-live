import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { ContactsListItem } from "../../../types";

type ContactsMeListItemProps = Readonly<{
  contact: ContactsListItem;
  addressCountLabel: string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsMeListItem({
  contact,
  addressCountLabel,
  onOpen,
}: ContactsMeListItemProps): React.JSX.Element {
  const getDisplayName = useContactDisplayName();

  return (
    <ListItem
      testID="contacts-me-item"
      onPress={() => onOpen(contact.contactId)}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.name}
          isMe={contact.isMe}
          size="md"
          testId="contacts-me-avatar"
        />
        <ListItemContent>
          <ListItemTitle testID="contacts-me-name">{getDisplayName(contact)}</ListItemTitle>
          <ListItemDescription testID="contacts-me-address-count">
            {addressCountLabel}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
