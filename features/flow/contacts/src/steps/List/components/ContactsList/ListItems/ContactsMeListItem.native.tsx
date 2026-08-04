import React from "react";
import {
  Avatar,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem } from "../../../types";

type ContactsMeListItemProps = Readonly<{
  contact: ContactsListItem;
  avatarSrc: string;
  addressCountLabel: string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsMeListItem({
  contact,
  avatarSrc,
  addressCountLabel,
  onOpen,
}: ContactsMeListItemProps): React.JSX.Element {
  return (
    <ListItem
      testID="contacts-me-item"
      onPress={() => onOpen(contact.contactId)}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <Avatar size="sm" src={avatarSrc} alt={contact.name} />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>{addressCountLabel}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
