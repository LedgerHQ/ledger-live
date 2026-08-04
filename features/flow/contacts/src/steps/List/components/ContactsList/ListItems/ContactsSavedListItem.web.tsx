import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { getContactAvatarColorClass } from "../../../utils/getContactAvatarColorClass";
import type { ContactsListItem } from "../../../types";

type ContactsSavedListItemProps = Readonly<{
  contact: ContactsListItem;
  formatAddressCount: (count: number) => string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsSavedListItem({
  contact,
  formatAddressCount,
  onOpen,
}: ContactsSavedListItemProps): React.ReactNode {
  const avatarColorClass = getContactAvatarColorClass(contact.contactId);

  return (
    <ListItem
      onClick={() => onOpen(contact.contactId)}
      data-testid={`contacts-saved-row-${contact.contactId}`}
    >
      <ListItemLeading>
        <div
          className={`body-1-semi-bold flex size-48 shrink-0 items-center justify-center rounded-full ${avatarColorClass}`}
          aria-hidden
          data-testid={`contacts-saved-avatar-${contact.contactId}`}
        >
          {contact.initial}
        </div>
        <ListItemContent>
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>
            {formatAddressCount(contact.addressCount)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
