import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { MeAvatar } from "@features/platform-contacts";
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
  return (
    <ListItem
      onClick={() => onOpen(contact.contactId)}
      onPointerUp={event => event.currentTarget.blur()}
      data-testid="contacts-me-row"
    >
      <ListItemLeading>
        <MeAvatar name={contact.name} size="md" ariaHidden testId="contacts-me-avatar" />
        <ListItemContent>
          <ListItemTitle data-testid="contacts-me-name">{contact.name}</ListItemTitle>
          <ListItemDescription data-testid="contacts-me-address-count">
            {formatAddressCount(contact.addressCount)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
