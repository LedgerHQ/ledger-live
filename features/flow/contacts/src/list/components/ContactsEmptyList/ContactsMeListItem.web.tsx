import React from "react";
import {
  Avatar,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import type { ContactsListItem } from "../../types";

type ContactsMeListItemProps = Readonly<{
  contact: ContactsListItem;
  avatarSrc: string;
  formatAddressCount: (count: number) => string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsMeListItem({
  contact,
  avatarSrc,
  formatAddressCount,
  onOpen,
}: ContactsMeListItemProps): React.ReactNode {
  return (
    <ListItem
      className="bg-muted"
      onClick={() => onOpen(contact.contactId)}
      data-testid="contacts-empty-list-me-row"
    >
      <ListItemLeading>
        <Avatar size="md" src={avatarSrc} data-testid="contacts-empty-list-me-avatar" />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>{formatAddressCount(contact.addressCount)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
