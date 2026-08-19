import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { ContactAvatar } from "@features/platform-contacts/web";
import type { ContactsListItem } from "../../../types";

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
    <ListItem onClick={() => onOpen(contact.contactId)} data-testid="contacts-me-row">
      <ListItemLeading>
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.name}
          isMe
          src={avatarSrc}
          size="md"
          ariaHidden
          testId="contacts-me-avatar"
        />
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>{formatAddressCount(contact.addressCount)}</ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
