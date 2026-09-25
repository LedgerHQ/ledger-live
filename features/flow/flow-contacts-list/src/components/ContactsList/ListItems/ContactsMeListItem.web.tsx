import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { ContactsListItem } from "../../../types";

type ContactsMeListItemProps = Readonly<{
  contact: ContactsListItem;
  formatAddressCount: (count: number) => string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsMeListItem({
  contact,
  formatAddressCount,
  onOpen,
}: ContactsMeListItemProps): React.ReactNode {
  const getDisplayName = useContactDisplayName();

  return (
    <ListItem
      onClick={() => onOpen(contact.contactId)}
      onPointerUp={event => event.currentTarget.blur()}
      data-testid="contacts-me-row"
    >
      <ListItemLeading>
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.name}
          isMe={contact.isMe}
          size="md"
          ariaHidden
          testId="contacts-me-avatar"
        />
        <ListItemContent>
          <ListItemTitle data-testid="contacts-me-name">{getDisplayName(contact)}</ListItemTitle>
          <ListItemDescription data-testid="contacts-me-address-count">
            {formatAddressCount(contact.addressCount)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
